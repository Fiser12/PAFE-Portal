import type { NodeId, QuestionId } from "../domain/ids";
import { toNodeId } from "../domain/ids";
import type { SchemaProblem } from "../domain/problem";
import type {
  AnswerValue,
  FlowSchema,
  Guard,
  NumericExpr,
  PageNode,
  Question,
} from "../domain/schema";
import type { FlowState, ProbePageReport, ProbeReport } from "../domain/state";
import type { QuestionPluginRegistry } from "../plugins/question-plugin";
import { evaluateGuard } from "../semantics/evaluate";
import { currentPageProblems } from "../semantics/validate";
import { check } from "./check";

const ASSIGNMENT_LIMIT = 4096;
const WITNESS_LIMIT = 16;

type Candidate = AnswerValue | undefined;

const pathTo = (schema: FlowSchema, target: NodeId): readonly NodeId[] => {
  const visit = (nodeId: NodeId): readonly NodeId[] | undefined => {
    if (nodeId === target) return [nodeId];
    const node = schema.nodes[nodeId];
    if (node?.kind !== "page") return undefined;
    for (const edge of node.edges) {
      const tail = visit(edge.to);
      if (tail) return [nodeId, ...tail];
    }
    return undefined;
  };
  return visit(schema.entry) as readonly NodeId[];
};

const numericLiterals = (guard: Guard): readonly number[] => {
  switch (guard.kind) {
    case "always":
    case "answered":
    case "selected":
      return [];
    case "not":
      return numericLiterals(guard.value);
    case "all":
    case "any":
      return guard.values.flatMap(numericLiterals);
    case "cmp": {
      const values: number[] = [];
      const collect = (expression: typeof guard.left): void => {
        if (expression.kind === "num") values.push(expression.value);
        if (expression.kind === "sum") expression.values.forEach(collect);
      };
      collect(guard.left);
      collect(guard.right);
      return values;
    }
  }
};

const guardQuestions = (guard: Guard): readonly QuestionId[] => {
  const numericQuestions = (expression: NumericExpr): readonly QuestionId[] => {
    if (expression.kind === "answer" || expression.kind === "score")
      return [expression.q];
    if (expression.kind === "sum")
      return expression.values.flatMap(numericQuestions);
    return [];
  };
  switch (guard.kind) {
    case "always":
      return [];
    case "answered":
    case "selected":
      return [guard.q];
    case "not":
      return guardQuestions(guard.value);
    case "all":
    case "any":
      return guard.values.flatMap(guardQuestions);
    case "cmp":
      return [
        ...numericQuestions(guard.left),
        ...numericQuestions(guard.right),
      ];
  }
};

const domainFor = (
  question: Question,
  thresholds: readonly number[],
  plugins: QuestionPluginRegistry,
): readonly Candidate[] => {
  const values = plugins
    .get(question.kind)
    ?.probeValues?.(question, { numericThresholds: thresholds });
  return [undefined, ...((values ?? []) as readonly AnswerValue[])];
};

const assignmentAt = (
  questions: readonly Question[],
  domains: readonly (readonly Candidate[])[],
  ordinal: number,
): Readonly<Record<QuestionId, AnswerValue>> => {
  let remaining = ordinal;
  const answers: [QuestionId, AnswerValue][] = [];
  for (let index = domains.length - 1; index >= 0; index -= 1) {
    const domain = domains[index] as readonly Candidate[];
    const question = questions[index] as Question;
    const value = domain[remaining % domain.length];
    remaining = Math.floor(remaining / domain.length);
    if (value !== undefined) answers.push([question.id, value]);
  }
  return Object.fromEntries(answers);
};

const explorePage = (
  schema: FlowSchema,
  nodeId: NodeId,
  page: PageNode,
  plugins: QuestionPluginRegistry,
): ProbePageReport => {
  const thresholds = page.edges.flatMap(({ when }) => numericLiterals(when));
  const path = pathTo(schema, nodeId);
  const pathNodes = path
    .map((id) => schema.nodes[id])
    .filter((node): node is PageNode => node?.kind === "page");
  const questionsById = new Map(
    pathNodes
      .flatMap((node) => node.questions)
      .map((question) => [question.id, question]),
  );
  const pageQuestionIds = new Set(page.questions.map(({ id }) => id));
  const externalQuestions = Array.from(
    new Set(page.edges.flatMap(({ when }) => guardQuestions(when))),
  )
    .filter((questionId) => !pageQuestionIds.has(questionId))
    .map((questionId) => questionsById.get(questionId))
    .filter((question): question is Question => question !== undefined);
  const questions = [...externalQuestions, ...page.questions];
  const domains = questions.map((question, index) => {
    const domain = domainFor(question, thresholds, plugins);
    return index < externalQuestions.length && question.required === true
      ? domain.filter((candidate) => candidate !== undefined)
      : domain;
  });
  const candidateSpace = domains.reduce(
    (total, domain) => total * BigInt(domain.length),
    1n,
  );
  const explored = Number(
    candidateSpace > BigInt(ASSIGNMENT_LIMIT)
      ? ASSIGNMENT_LIMIT
      : candidateSpace,
  );
  const witnesses: {
    readonly answers: Readonly<Record<QuestionId, AnswerValue>>;
  }[] = [];
  let deadEndsFound = 0;

  for (let ordinal = 0; ordinal < explored; ordinal += 1) {
    const answers = assignmentAt(questions, domains, ordinal);
    const state: FlowState = {
      status: "active",
      schemaId: schema.id,
      schemaVersion: schema.version,
      trail: path,
      answers,
    };
    const valid = currentPageProblems(schema, state, plugins).length === 0;
    const routes = page.edges.some(
      ({ when }) => evaluateGuard(schema, state, when, plugins) === "true",
    );
    if (valid && !routes) {
      deadEndsFound += 1;
      if (witnesses.length < WITNESS_LIMIT) witnesses.push({ answers });
    }
  }

  return {
    node: nodeId,
    candidateSpace: candidateSpace.toString(),
    explored,
    truncated: candidateSpace > BigInt(ASSIGNMENT_LIMIT),
    numericSampling: questions.some((question) =>
      plugins
        .get(question.kind)
        ?.conditions(question)
        .some(
          (capability) =>
            capability.kind === "compare" && capability.source === "answer",
        ),
    ),
    deadEndsFound,
    witnesses,
  };
};

const probeProblem = (
  code: "probe-budget-exceeded" | "semantic-dead-end",
  page: ProbePageReport,
): SchemaProblem => ({
  severity: code === "semantic-dead-end" ? "error" : "warning",
  code,
  where: { node: page.node },
  suggestion:
    code === "semantic-dead-end"
      ? "Add a route for the reported valid answer assignment."
      : "Reduce the candidate domain or split the page.",
  details: {
    candidateSpace: page.candidateSpace,
    explored: page.explored,
    ...(code === "semantic-dead-end"
      ? { deadEndsFound: page.deadEndsFound }
      : {}),
  },
});

export const probe = (
  schema: FlowSchema,
  plugins: QuestionPluginRegistry,
): ProbeReport => {
  const structural = check(schema, plugins);
  if (structural.some(({ severity }) => severity === "error")) {
    return { complete: false, pages: [], problems: structural };
  }

  const pages = Object.entries(schema.nodes)
    .map(([nodeId, node]) => [toNodeId(nodeId), node] as const)
    .filter(
      (entry): entry is readonly [NodeId, PageNode] => entry[1].kind === "page",
    )
    .filter(([, page]) => page.edges.some(({ when }) => when.kind !== "always"))
    .map(([nodeId, page]) => explorePage(schema, nodeId, page, plugins));
  const semantic = pages.flatMap((page) => [
    ...(page.truncated ? [probeProblem("probe-budget-exceeded", page)] : []),
    ...(page.deadEndsFound > 0
      ? [probeProblem("semantic-dead-end", page)]
      : []),
  ]);
  return {
    complete: pages.every(({ truncated }) => !truncated),
    pages,
    problems: [...structural, ...semantic],
  };
};
