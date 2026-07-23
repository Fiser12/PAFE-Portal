import { toNodeId, type NodeId, type QuestionId } from "../domain/ids";
import type { SchemaProblem, SchemaProblemCode } from "../domain/problem";
import type {
  FlowSchema,
  Guard,
  NumericExpr,
  Question,
} from "../domain/schema";
import type { QuestionPluginRegistry } from "../plugins/question-plugin";

type QuestionLocation = {
  readonly page: NodeId;
  readonly index: number;
  readonly question: Question;
};

type Reference = {
  readonly q: QuestionId;
  readonly expected?: "answer" | "score" | "selected";
  readonly option?: string;
};

const suggestionFor = (code: SchemaProblemCode): string =>
  ({
    "missing-entry": "Point entry to an existing page node.",
    "entry-not-page": "Insert a page as the schema entry.",
    "dangling-node": "Create the target node or update the edge target.",
    "unreachable-node": "Connect this node from the entry or remove it.",
    "no-terminal-reachable":
      "Add a directed path from this page to a terminal.",
    "cycle-detected": "Remove the cyclic edge; core v1 graphs must be acyclic.",
    "duplicate-question": "Give every question a schema-wide unique id.",
    "duplicate-option": "Give every option in this question a unique id.",
    "duplicate-edge-target": "Combine same-target guards with any([...]).",
    "shadowed-edge": "Move the unconditional edge to the final position.",
    "ill-founded-visibility":
      "Reference only earlier or strict-ancestor questions.",
    "invalid-expression-reference":
      "Reference an existing question of the required kind.",
    "invalid-constraint": "Correct the contradictory or negative constraint.",
    "missing-default-edge":
      "Add a final always edge or prove every assignment with probe().",
    "empty-all": "Replace the empty conjunction with an explicit always guard.",
    "empty-any": "Remove the empty disjunction or add its intended operands.",
    "weight-overflow-risk":
      "Reduce option weights so every possible score stays safe.",
    "probe-budget-exceeded": "Reduce the candidate domain or split the page.",
    "semantic-dead-end":
      "Add a route for the reported valid answer assignment.",
  })[code];

const issue = (
  severity: SchemaProblem["severity"],
  code: SchemaProblemCode,
  where: SchemaProblem["where"],
  details?: SchemaProblem["details"],
): SchemaProblem => ({
  severity,
  code,
  where,
  suggestion: suggestionFor(code),
  ...(details ? { details } : {}),
});

const referencesInNumeric = (expression: NumericExpr): readonly Reference[] => {
  switch (expression.kind) {
    case "num":
      return [];
    case "answer":
      return [{ q: expression.q, expected: "answer" }];
    case "score":
      return [{ q: expression.q, expected: "score" }];
    case "sum":
      return expression.values.flatMap(referencesInNumeric);
  }
};

const referencesInGuard = (guard: Guard): readonly Reference[] => {
  switch (guard.kind) {
    case "always":
      return [];
    case "answered":
      return [{ q: guard.q }];
    case "selected":
      return [{ q: guard.q, expected: "selected", option: guard.option }];
    case "not":
      return referencesInGuard(guard.value);
    case "all":
    case "any":
      return guard.values.flatMap(referencesInGuard);
    case "cmp":
      return [
        ...referencesInNumeric(guard.left),
        ...referencesInNumeric(guard.right),
      ];
  }
};

const emptyGuardProblems = (
  guard: Guard,
  where: SchemaProblem["where"],
): readonly SchemaProblem[] => {
  const own =
    (guard.kind === "all" || guard.kind === "any") && guard.values.length === 0
      ? [
          issue(
            "warning",
            guard.kind === "all" ? "empty-all" : "empty-any",
            where,
          ),
        ]
      : [];
  if (guard.kind === "not")
    return [...own, ...emptyGuardProblems(guard.value, where)];
  if (guard.kind === "all" || guard.kind === "any") {
    return [
      ...own,
      ...guard.values.flatMap((value) => emptyGuardProblems(value, where)),
    ];
  }
  return own;
};

// One O(V+E) traversal per queried source, cached for the duration of a
// check() run; guard references would otherwise enumerate paths repeatedly.
const createReachability = (schema: FlowSchema) => {
  const cache = new Map<NodeId, ReadonlySet<NodeId>>();
  const reachableFrom = (from: NodeId): ReadonlySet<NodeId> => {
    const cached = cache.get(from);
    if (cached) return cached;
    const visited = new Set<NodeId>();
    const stack: NodeId[] = [from];
    while (stack.length > 0) {
      const nodeId = stack.pop() as NodeId;
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      const node = schema.nodes[nodeId];
      if (node?.kind === "page") {
        for (const edge of node.edges) stack.push(edge.to);
      }
    }
    cache.set(from, visited);
    return visited;
  };
  return (from: NodeId, to: NodeId): boolean => reachableFrom(from).has(to);
};

export const check = (
  schema: FlowSchema,
  plugins: QuestionPluginRegistry,
): readonly SchemaProblem[] => {
  const problems: SchemaProblem[] = [];
  const nodes = Object.entries(schema.nodes).map(
    ([nodeId, node]) => [toNodeId(nodeId), node] as const,
  );
  const entry = schema.nodes[schema.entry];

  if (!entry)
    problems.push(issue("error", "missing-entry", { node: schema.entry }));
  else if (entry.kind !== "page") {
    problems.push(issue("error", "entry-not-page", { node: schema.entry }));
  }

  for (const [nodeId, node] of nodes) {
    if (node.kind !== "page") continue;
    const targets = new Map<NodeId, number>();
    const alwaysIndex = node.edges.findIndex(
      ({ when }) => when.kind === "always",
    );
    node.edges.forEach((edge, edgeIndex) => {
      if (!schema.nodes[edge.to]) {
        problems.push(
          issue("error", "dangling-node", {
            node: nodeId,
            edge: edgeIndex,
            to: edge.to,
          }),
        );
      }
      const first = targets.get(edge.to);
      if (first !== undefined) {
        problems.push(
          issue("error", "duplicate-edge-target", {
            node: nodeId,
            edge: edgeIndex,
            first,
          }),
        );
      } else {
        targets.set(edge.to, edgeIndex);
      }
      if (alwaysIndex >= 0 && edgeIndex > alwaysIndex) {
        problems.push(
          issue("error", "shadowed-edge", { node: nodeId, edge: edgeIndex }),
        );
      }
      problems.push(
        ...emptyGuardProblems(edge.when, { node: nodeId, edge: edgeIndex }),
      );
    });
    if (alwaysIndex < 0) {
      problems.push(issue("warning", "missing-default-edge", { node: nodeId }));
    }
  }

  const reachable = new Set<NodeId>();
  const collectReachable = (nodeId: NodeId): void => {
    const node = schema.nodes[nodeId];
    if (reachable.has(nodeId) || !node) return;
    reachable.add(nodeId);
    if (node.kind === "page")
      node.edges.forEach(({ to }) => collectReachable(to));
  };
  collectReachable(schema.entry);
  for (const [nodeId] of nodes) {
    if (!reachable.has(nodeId)) {
      problems.push(issue("error", "unreachable-node", { node: nodeId }));
    }
  }

  const colour = new Map<NodeId, "gray" | "black">();
  const visitCycle = (nodeId: NodeId, stack: readonly NodeId[]): void => {
    const node = schema.nodes[nodeId];
    if (!node || colour.get(nodeId) === "black") return;
    colour.set(nodeId, "gray");
    if (node.kind === "page") {
      node.edges.forEach(({ to }) => {
        if (colour.get(to) === "gray") {
          const start = stack.indexOf(to);
          const cycle = [
            ...(start >= 0 ? stack.slice(start) : stack),
            nodeId,
            to,
          ];
          problems.push(
            issue("error", "cycle-detected", { node: nodeId, to }, { cycle }),
          );
        } else {
          visitCycle(to, [...stack, nodeId]);
        }
      });
    }
    colour.set(nodeId, "black");
  };
  nodes.forEach(([nodeId]) => visitCycle(nodeId, []));

  const predecessors = new Map<NodeId, NodeId[]>();
  const terminalReachable = new Set<NodeId>();
  nodes.forEach(([nodeId, node]) => {
    if (node.kind === "terminal") terminalReachable.add(nodeId);
    if (node.kind !== "page") return;
    node.edges.forEach(({ to }) => {
      const previous = predecessors.get(to) ?? [];
      predecessors.set(to, [...previous, nodeId]);
    });
  });
  const queue = [...terminalReachable];
  for (const nodeId of queue) {
    for (const predecessor of predecessors.get(nodeId) ?? []) {
      if (terminalReachable.has(predecessor)) continue;
      terminalReachable.add(predecessor);
      queue.push(predecessor);
    }
  }
  for (const [nodeId, node] of nodes) {
    if (node.kind === "page" && !terminalReachable.has(nodeId)) {
      problems.push(issue("error", "no-terminal-reachable", { node: nodeId }));
    }
  }

  const canReach = createReachability(schema);
  const questions = new Map<QuestionId, QuestionLocation>();
  for (const [page, node] of nodes) {
    if (node.kind !== "page") continue;
    node.questions.forEach((question, index) => {
      const first = questions.get(question.id);
      if (first) {
        problems.push(
          issue("error", "duplicate-question", {
            node: page,
            question: question.id,
            firstNode: first.page,
          }),
        );
      } else {
        questions.set(question.id, { page, index, question });
      }
      const plugin = plugins.get(question.kind);
      if (plugin === undefined) {
        problems.push(
          issue(
            "error",
            "invalid-constraint",
            { node: page, question: question.id },
            {
              plugin: question.kind,
            },
          ),
        );
      } else {
        problems.push(
          ...(plugin.validateQuestion?.(question) ?? []).map(
            (pluginProblem) => ({
              ...pluginProblem,
              where: { node: page, ...pluginProblem.where },
            }),
          ),
        );
      }
    });
  }

  const inspectReferences = (
    guard: Guard,
    page: NodeId,
    where: SchemaProblem["where"],
    visibilityIndex?: number,
  ): void => {
    for (const reference of referencesInGuard(guard)) {
      const location = questions.get(reference.q);
      const capabilities = location
        ? (plugins.get(location.question.kind)?.conditions(location.question) ??
          [])
        : [];
      const supported =
        reference.expected === undefined ||
        (reference.expected === "selected"
          ? capabilities.some(
              (capability) =>
                capability.kind === "selected" &&
                (reference.option === undefined ||
                  capability.options.some(({ id }) => id === reference.option)),
            )
          : capabilities.some(
              (capability) =>
                capability.kind === "compare" &&
                capability.source === reference.expected,
            ));
      if (!location || !supported) {
        problems.push(
          issue("error", "invalid-expression-reference", {
            ...where,
            question: reference.q,
          }),
        );
        continue;
      }
      const isEarlier =
        location.page === page &&
        location.index < (visibilityIndex ?? Infinity);
      const isAncestor =
        location.page !== page && canReach(location.page, page);
      if (visibilityIndex !== undefined && !isEarlier && !isAncestor) {
        problems.push(
          issue("error", "ill-founded-visibility", {
            ...where,
            question: reference.q,
          }),
        );
      }
      if (visibilityIndex === undefined && !isEarlier && !isAncestor) {
        problems.push(
          issue("error", "invalid-expression-reference", {
            ...where,
            question: reference.q,
          }),
        );
      }
    }
  };

  for (const [page, node] of nodes) {
    if (node.kind !== "page") continue;
    node.questions.forEach((question, index) => {
      if (question.visibleWhen) {
        inspectReferences(
          question.visibleWhen,
          page,
          { node: page, question: question.id },
          index,
        );
        problems.push(
          ...emptyGuardProblems(question.visibleWhen, {
            node: page,
            question: question.id,
          }),
        );
      }
    });
    node.edges.forEach((edge, edgeIndex) =>
      inspectReferences(edge.when, page, { node: page, edge: edgeIndex }),
    );
  }

  return problems;
};
