import {
  toNodeId,
  toSafeInt,
  type NodeId,
  type QuestionId,
} from "../domain/ids";
import type {
  AnswerValue,
  FlowSchema,
  Guard,
  NumericExpr,
  NumericResult,
  Question,
  Truth,
} from "../domain/schema";
import type { FlowState } from "../domain/state";
import type { QuestionPluginRegistry } from "../plugins/question-plugin";
import { allTruth, anyTruth, notTruth } from "./truth";

export type QuestionLocation = {
  readonly page: NodeId;
  readonly index: number;
  readonly question: Question;
};

// Schemas are immutable after parsing, so the location index can be cached
// per schema object without changing the function's pure semantics.
const questionIndexes = new WeakMap<
  FlowSchema,
  ReadonlyMap<QuestionId, QuestionLocation>
>();

const questionIndex = (
  schema: FlowSchema,
): ReadonlyMap<QuestionId, QuestionLocation> => {
  const cached = questionIndexes.get(schema);
  if (cached) return cached;
  const built = new Map<QuestionId, QuestionLocation>();
  for (const [nodeId, node] of Object.entries(schema.nodes)) {
    if (node.kind !== "page") continue;
    node.questions.forEach((question, index) => {
      if (!built.has(question.id)) {
        built.set(question.id, { page: toNodeId(nodeId), index, question });
      }
    });
  }
  questionIndexes.set(schema, built);
  return built;
};

export const findQuestion = (
  schema: FlowSchema,
  questionId: QuestionId,
): QuestionLocation | undefined => questionIndex(schema).get(questionId);

const pluginFor = (plugins: QuestionPluginRegistry, question: Question) =>
  plugins.get(question.kind);

export const isTypedAnswer = (
  plugins: QuestionPluginRegistry,
  question: Question,
  value: AnswerValue,
): boolean =>
  pluginFor(plugins, question)?.answerSchema.safeParse(value).success === true;

const activeValue = (
  schema: FlowSchema,
  state: FlowState,
  questionId: QuestionId,
  visiting: readonly QuestionId[],
  plugins: QuestionPluginRegistry,
): { readonly question: Question; readonly value: AnswerValue } | undefined => {
  const location = findQuestion(schema, questionId);
  if (!location || !state.trail.includes(location.page)) return undefined;
  const value = state.answers[questionId];
  if (
    value === undefined ||
    !isTypedAnswer(plugins, location.question, value) ||
    !isQuestionVisible(schema, state, questionId, plugins, visiting)
  ) {
    return undefined;
  }
  return { question: location.question, value };
};

export const isQuestionVisible = (
  schema: FlowSchema,
  state: FlowState,
  questionId: QuestionId,
  plugins: QuestionPluginRegistry,
  visiting: readonly QuestionId[] = [],
): boolean => {
  const location = findQuestion(schema, questionId);
  if (
    !location ||
    !state.trail.includes(location.page) ||
    visiting.includes(questionId)
  ) {
    return false;
  }
  return (
    location.question.visibleWhen === undefined ||
    evaluateGuardInternal(
      schema,
      state,
      location.question.visibleWhen,
      plugins,
      [...visiting, questionId],
    ) === "true"
  );
};

const known = (value: bigint): NumericResult =>
  value >= BigInt(Number.MIN_SAFE_INTEGER) &&
  value <= BigInt(Number.MAX_SAFE_INTEGER)
    ? { kind: "known", value: toSafeInt(Number(value)) }
    : { kind: "unknown" };

const evaluateNumericInternal = (
  schema: FlowSchema,
  state: FlowState,
  expression: NumericExpr,
  plugins: QuestionPluginRegistry,
  visiting: readonly QuestionId[],
): NumericResult => {
  switch (expression.kind) {
    case "num":
      return { kind: "known", value: expression.value };
    case "answer": {
      const active = activeValue(
        schema,
        state,
        expression.q,
        visiting,
        plugins,
      );
      if (!active) return { kind: "unknown" };
      const value = pluginFor(plugins, active.question)?.numericValue?.(
        active.question,
        active.value,
      );
      return value === undefined
        ? { kind: "unknown" }
        : { kind: "known", value };
    }
    case "score": {
      const active = activeValue(
        schema,
        state,
        expression.q,
        visiting,
        plugins,
      );
      if (!active) return { kind: "unknown" };
      const value = pluginFor(plugins, active.question)?.score?.(
        active.question,
        active.value,
      );
      return value === undefined
        ? { kind: "unknown" }
        : { kind: "known", value };
    }
    case "sum": {
      const values = expression.values.map((value) =>
        evaluateNumericInternal(schema, state, value, plugins, visiting),
      );
      return values.some((value) => value.kind === "unknown")
        ? { kind: "unknown" }
        : known(
            values.reduce(
              (total, value) =>
                total +
                BigInt(
                  (value as NumericResult & { readonly kind: "known" }).value,
                ),
              0n,
            ),
          );
    }
  }
};

export const evaluateNumeric = (
  schema: FlowSchema,
  state: FlowState,
  expression: NumericExpr,
  plugins: QuestionPluginRegistry,
): NumericResult =>
  evaluateNumericInternal(schema, state, expression, plugins, []);

const compare = (
  left: number,
  right: number,
  op: Guard & { readonly kind: "cmp" },
): boolean => {
  switch (op.op) {
    case "eq":
      return left === right;
    case "ne":
      return left !== right;
    case "lt":
      return left < right;
    case "lte":
      return left <= right;
    case "gt":
      return left > right;
    case "gte":
      return left >= right;
  }
};

const evaluateGuardInternal = (
  schema: FlowSchema,
  state: FlowState,
  guard: Guard,
  plugins: QuestionPluginRegistry,
  visiting: readonly QuestionId[],
): Truth => {
  switch (guard.kind) {
    case "always":
      return "true";
    case "answered":
      return activeValue(schema, state, guard.q, visiting, plugins)
        ? "true"
        : "false";
    case "selected": {
      const active = activeValue(schema, state, guard.q, visiting, plugins);
      if (!active) return "unknown";
      const selected = pluginFor(plugins, active.question)?.isSelected?.(
        active.question,
        active.value,
        guard.option,
      );
      return selected === undefined ? "unknown" : selected ? "true" : "false";
    }
    case "not":
      return notTruth(
        evaluateGuardInternal(schema, state, guard.value, plugins, visiting),
      );
    case "all":
      return allTruth(
        guard.values.map((value) =>
          evaluateGuardInternal(schema, state, value, plugins, visiting),
        ),
      );
    case "any":
      return anyTruth(
        guard.values.map((value) =>
          evaluateGuardInternal(schema, state, value, plugins, visiting),
        ),
      );
    case "cmp": {
      const left = evaluateNumericInternal(
        schema,
        state,
        guard.left,
        plugins,
        visiting,
      );
      const right = evaluateNumericInternal(
        schema,
        state,
        guard.right,
        plugins,
        visiting,
      );
      return left.kind === "known" && right.kind === "known"
        ? compare(left.value, right.value, guard)
          ? "true"
          : "false"
        : "unknown";
    }
  }
};

export const evaluateGuard = (
  schema: FlowSchema,
  state: FlowState,
  guard: Guard,
  plugins: QuestionPluginRegistry,
): Truth => evaluateGuardInternal(schema, state, guard, plugins, []);
