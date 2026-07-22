export * from "../../src/index.js";

import { z } from "zod";

import {
  createFlowGraphRuntime,
  createQuestionPluginRegistry,
  guardWireSchema,
  nonEmptyStringSchema,
  safeIntSchema,
  textRefSchema,
  toOptionId,
  toSafeInt,
  type OptionId,
  type QuestionDefinition,
  type QuestionOption,
  type QuestionPlugin,
  type SafeInt,
} from "../../src/index.js";

export type TestTextQuestion = QuestionDefinition & {
  readonly kind: "text";
  readonly maxLength?: SafeInt;
};

export type TestNumberQuestion = QuestionDefinition & {
  readonly kind: "number";
  readonly min?: SafeInt;
  readonly max?: SafeInt;
};

export type TestSelectQuestion = QuestionDefinition & {
  readonly kind: "select";
  readonly multiple?: boolean;
  readonly options: readonly QuestionOption[];
};

declare module "../../src/domain/schema.js" {
  interface QuestionTypeMap {
    readonly text: TestTextQuestion;
    readonly number: TestNumberQuestion;
    readonly select: TestSelectQuestion;
  }

  interface QuestionAnswerTypeMap {
    readonly text: string;
    readonly number: SafeInt;
    readonly select: readonly OptionId[];
  }
}

const common = {
  id: nonEmptyStringSchema,
  text: textRefSchema,
  required: z.boolean().optional(),
  visibleWhen: guardWireSchema.optional(),
};

const textPlugin: QuestionPlugin<TestTextQuestion, string> = {
  kind: "text",
  version: "test",
  questionSchema: z.strictObject({
    kind: z.literal("text"),
    ...common,
    maxLength: safeIntSchema.refine((value) => value >= 0).optional(),
  }) as unknown as z.ZodType<TestTextQuestion>,
  answerSchema: z.string(),
  createDefault: ({ id, text }) => ({ kind: "text", id, text }),
  isAnswered: (_question, answer) => answer !== undefined && answer.length > 0,
  validateAnswer: (question, answer, phase) =>
    phase === "submit" &&
    question.maxLength !== undefined &&
    Array.from(answer).length > question.maxLength
      ? [{ code: "too-long" }]
      : [],
  validateQuestion: (question) =>
    question.maxLength !== undefined && question.maxLength < 0
      ? [
          {
            severity: "error",
            code: "invalid-constraint",
            where: { question: question.id },
            suggestion: "Fix constraint.",
          },
        ]
      : [],
  conditions: () => [{ kind: "answered" }],
  probeValues: () => ["x"],
  namespace: (question, { questionId }) => ({
    ...question,
    id: questionId(question.id),
  }),
};

const numberPlugin: QuestionPlugin<TestNumberQuestion, SafeInt> = {
  kind: "number",
  version: "test",
  questionSchema: z.strictObject({
    kind: z.literal("number"),
    ...common,
    min: safeIntSchema.optional(),
    max: safeIntSchema.optional(),
  }) as unknown as z.ZodType<TestNumberQuestion>,
  answerSchema: safeIntSchema as unknown as z.ZodType<SafeInt>,
  createDefault: ({ id, text }) => ({ kind: "number", id, text }),
  isAnswered: (_question, answer) => answer !== undefined,
  validateAnswer: (question, answer, phase) =>
    phase === "submit" &&
    ((question.min !== undefined && answer < question.min) ||
      (question.max !== undefined && answer > question.max))
      ? [{ code: "out-of-range" }]
      : [],
  validateQuestion: (question) =>
    question.min !== undefined &&
    question.max !== undefined &&
    question.min > question.max
      ? [
          {
            severity: "error",
            code: "invalid-constraint",
            where: { question: question.id },
            suggestion: "Fix constraint.",
          },
        ]
      : [],
  conditions: () => [
    { kind: "answered" },
    {
      kind: "compare",
      source: "answer",
      operators: ["eq", "ne", "lt", "lte", "gt", "gte"],
    },
  ],
  numericValue: (_question, answer) => answer,
  probeValues: (question, { numericThresholds }) => {
    const values = [
      question.min,
      question.max,
      ...numericThresholds.flatMap((value) => [value - 1, value, value + 1]),
    ].filter(
      (value): value is number =>
        value !== undefined && Number.isSafeInteger(value),
    );
    return [
      ...new Set(
        (values.length > 0 ? values : [0]).map((value) =>
          toSafeInt(
            Math.min(
              question.max ?? Number.MAX_SAFE_INTEGER,
              Math.max(question.min ?? Number.MIN_SAFE_INTEGER, value),
            ),
          ),
        ),
      ),
    ];
  },
  namespace: (question, { questionId }) => ({
    ...question,
    id: questionId(question.id),
  }),
};

const selectPlugin: QuestionPlugin<TestSelectQuestion, readonly OptionId[]> = {
  kind: "select",
  version: "test",
  questionSchema: z.strictObject({
    kind: z.literal("select"),
    ...common,
    multiple: z.boolean().optional(),
    options: z.array(
      z.strictObject({
        id: nonEmptyStringSchema,
        text: textRefSchema,
        weight: safeIntSchema.optional(),
      }),
    ),
  }) as unknown as z.ZodType<TestSelectQuestion>,
  answerSchema: z.array(nonEmptyStringSchema) as unknown as z.ZodType<
    readonly OptionId[]
  >,
  createDefault: ({ id, text }) => ({
    kind: "select",
    id,
    text,
    options: [{ id: toOptionId("option"), text }],
  }),
  isAnswered: (_question, answer) => answer !== undefined && answer.length > 0,
  validateAnswer: (question, answer) => {
    if (new Set(answer).size !== answer.length)
      return [{ code: "duplicate-option" }];
    if (
      answer.some((id) => !question.options.some((option) => option.id === id))
    )
      return [{ code: "unknown-option" }];
    return question.multiple !== true && answer.length > 1
      ? [{ code: "arity-mismatch" }]
      : [];
  },
  validateQuestion: (question) => {
    const duplicate =
      new Set(question.options.map(({ id }) => id)).size !==
      question.options.length;
    const weights = question.options.map(({ weight }) => weight ?? 0);
    const overflow =
      !Number.isSafeInteger(
        weights
          .filter((weight) => weight > 0)
          .reduce<number>((sum, weight) => sum + weight, 0),
      ) ||
      !Number.isSafeInteger(
        weights
          .filter((weight) => weight < 0)
          .reduce<number>((sum, weight) => sum + weight, 0),
      );
    return [
      ...(duplicate
        ? [
            {
              severity: "error" as const,
              code: "duplicate-option" as const,
              where: { question: question.id },
              suggestion: "Fix duplicate.",
            },
          ]
        : []),
      ...(overflow
        ? [
            {
              severity: "warning" as const,
              code: "weight-overflow-risk" as const,
              where: { question: question.id },
              suggestion: "Fix weights.",
            },
          ]
        : []),
    ];
  },
  conditions: (question) => [
    { kind: "answered" },
    { kind: "selected", options: question.options },
    {
      kind: "compare",
      source: "score",
      operators: ["eq", "ne", "lt", "lte", "gt", "gte"],
    },
  ],
  score: (question, answer) => {
    let total = 0n;
    for (const selected of answer) {
      const option = question.options.find(({ id }) => id === selected);
      if (!option) return undefined;
      total += BigInt(option.weight ?? 0);
    }
    return total >= BigInt(Number.MIN_SAFE_INTEGER) &&
      total <= BigInt(Number.MAX_SAFE_INTEGER)
      ? toSafeInt(Number(total))
      : undefined;
  },
  isSelected: (_question, answer, option) => answer.includes(option),
  probeValues: (question) =>
    question.multiple
      ? Array.from({ length: 2 ** question.options.length }, (_, mask) =>
          question.options
            .filter((_, index) => (mask & (2 ** index)) !== 0)
            .map(({ id }) => id),
        )
      : question.options.map(({ id }) => [id]),
  namespace: (question, { questionId, optionId }) => ({
    ...question,
    id: questionId(question.id),
    options: question.options.map((option) => ({
      ...option,
      id: optionId(option.id),
    })),
  }),
};

export const testQuestionPlugins = createQuestionPluginRegistry([
  textPlugin,
  numberPlugin,
  selectPlugin,
]);

export const testRuntime = createFlowGraphRuntime(testQuestionPlugins);

export const parseSchema = testRuntime.parseSchema;
export const parsePack = testRuntime.parsePack;
export const parseComposition = testRuntime.parseComposition;
export const check = testRuntime.check;
export const checkPack = testRuntime.checkPack;
export const compileComposition = testRuntime.compileComposition;
export const probe = testRuntime.probe;
export const decide = testRuntime.decide;
export const replay = testRuntime.replay;
export const evaluateGuard = testRuntime.evaluateGuard;
export const evaluateNumeric = testRuntime.evaluateNumeric;
export const isQuestionVisible = testRuntime.isQuestionVisible;
export const visibleQuestions = testRuntime.visibleQuestions;
export const activeAnswers = testRuntime.activeAnswers;
export const structuralAnswerProblems = testRuntime.structuralAnswerProblems;
export const questionProblems = testRuntime.questionProblems;
export const currentPageProblems = testRuntime.currentPageProblems;
export const runGoldens = testRuntime.runGoldens;

export type NumberQuestion = TestNumberQuestion;
export type TextQuestion = TestTextQuestion;
export type SelectQuestion = TestSelectQuestion;
