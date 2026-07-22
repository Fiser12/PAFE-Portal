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

export type TextQuestion = QuestionDefinition & {
  readonly kind: "text";
  readonly maxLength?: SafeInt;
};

declare module "flowgraph-core" {
  interface QuestionTypeMap {
    readonly text: TextQuestion;
  }

  interface QuestionAnswerTypeMap {
    readonly text: string;
  }
}

const questionSchema = z.strictObject({
  kind: z.literal("text"),
  id: nonEmptyStringSchema,
  text: textRefSchema,
  required: z.boolean().optional(),
  visibleWhen: guardWireSchema.optional(),
  maxLength: safeIntSchema.refine((value) => value >= 0).optional(),
}) as unknown as z.ZodType<TextQuestion>;

export const textQuestionPlugin: QuestionPlugin<TextQuestion, string> = {
  kind: "text",
  version: "1.0.0",
  questionSchema,
  answerSchema: z.string(),
  createDefault: ({ id, text }) => ({
    kind: "text",
    id,
    text,
    maxLength: toSafeInt(500),
  }),
  isAnswered: (_question, answer) => answer !== undefined && answer.length > 0,
  validateAnswer: (question, answer, phase) =>
    phase === "submit" &&
    question.maxLength !== undefined &&
    Array.from(answer).length > question.maxLength
      ? [{ code: "too-long" }]
      : [],
  validateQuestion: (question): readonly SchemaProblem[] =>
    question.maxLength !== undefined && question.maxLength < 0
      ? [
          {
            severity: "error",
            code: "invalid-constraint",
            where: { question: question.id },
            suggestion: "Use a non-negative maximum length.",
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
