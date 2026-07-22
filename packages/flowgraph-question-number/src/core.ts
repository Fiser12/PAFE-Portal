import {
  guardWireSchema,
  nonEmptyStringSchema,
  safeIntSchema,
  textRefSchema,
  toSafeInt,
  type QuestionDefinition,
  type QuestionPlugin,
  type SafeInt,
  type SchemaProblem,
} from "flowgraph-core";
import { z } from "zod";

export type NumberQuestion = QuestionDefinition & {
  readonly kind: "number";
  readonly min?: SafeInt;
  readonly max?: SafeInt;
};

declare module "flowgraph-core" {
  interface QuestionTypeMap {
    readonly number: NumberQuestion;
  }

  interface QuestionAnswerTypeMap {
    readonly number: SafeInt;
  }
}

const questionSchema = z.strictObject({
  kind: z.literal("number"),
  id: nonEmptyStringSchema,
  text: textRefSchema,
  required: z.boolean().optional(),
  visibleWhen: guardWireSchema.optional(),
  min: safeIntSchema.optional(),
  max: safeIntSchema.optional(),
}) as unknown as z.ZodType<NumberQuestion>;

const safeCandidate = (value: number, question: NumberQuestion): SafeInt =>
  toSafeInt(
    Math.min(
      question.max ?? Number.MAX_SAFE_INTEGER,
      Math.max(question.min ?? Number.MIN_SAFE_INTEGER, value),
    ),
  );

export const numberQuestionPlugin: QuestionPlugin<NumberQuestion, SafeInt> = {
  kind: "number",
  version: "1.0.0",
  questionSchema,
  answerSchema: safeIntSchema as unknown as z.ZodType<SafeInt>,
  createDefault: ({ id, text }) => ({ kind: "number", id, text }),
  isAnswered: (_question, answer) => answer !== undefined,
  validateAnswer: (question, answer, phase) =>
    phase === "submit" &&
    ((question.min !== undefined && answer < question.min) ||
      (question.max !== undefined && answer > question.max))
      ? [{ code: "out-of-range" }]
      : [],
  validateQuestion: (question): readonly SchemaProblem[] =>
    question.min !== undefined &&
    question.max !== undefined &&
    question.min > question.max
      ? [
          {
            severity: "error",
            code: "invalid-constraint",
            where: { question: question.id },
            suggestion: "Use a minimum lower than or equal to the maximum.",
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
    const raw = [
      question.min,
      question.max,
      ...numericThresholds.flatMap((value) => [value - 1, value, value + 1]),
    ].filter(
      (value): value is number =>
        value !== undefined && Number.isSafeInteger(value),
    );
    return Array.from(
      new Set(
        (raw.length > 0 ? raw : [0]).map((value) =>
          safeCandidate(value, question),
        ),
      ),
    );
  },
  namespace: (question, { questionId }) => ({
    ...question,
    id: questionId(question.id),
  }),
};
