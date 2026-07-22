import {
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
  type SchemaProblem,
} from "flowgraph-core";
import { z } from "zod";

export type SelectQuestion = QuestionDefinition & {
  readonly kind: "select";
  readonly multiple?: boolean;
  readonly options: readonly QuestionOption[];
};

declare module "flowgraph-core" {
  interface QuestionTypeMap {
    readonly select: SelectQuestion;
  }

  interface QuestionAnswerTypeMap {
    readonly select: readonly OptionId[];
  }
}

const optionSchema = z.strictObject({
  id: nonEmptyStringSchema,
  text: textRefSchema,
  weight: safeIntSchema.optional(),
});

const questionSchema = z.strictObject({
  kind: z.literal("select"),
  id: nonEmptyStringSchema,
  text: textRefSchema,
  required: z.boolean().optional(),
  visibleWhen: guardWireSchema.optional(),
  multiple: z.boolean().optional(),
  options: z.array(optionSchema),
}) as unknown as z.ZodType<SelectQuestion>;

const answerSchema = z
  .array(nonEmptyStringSchema)
  .superRefine((values, context) => {
    if (new Set(values).size !== values.length) {
      context.addIssue({
        code: "custom",
        message: "Option ids must be unique",
      });
    }
  }) as unknown as z.ZodType<readonly OptionId[]>;

const schemaIssue = (
  question: SelectQuestion,
  code: "duplicate-option" | "weight-overflow-risk",
  severity: "error" | "warning",
): SchemaProblem => ({
  severity,
  code,
  where: { question: question.id },
  suggestion:
    code === "duplicate-option"
      ? "Give every option in this question a unique id."
      : "Reduce option weights so every possible score stays safe.",
});

const subsets = (
  question: SelectQuestion,
): readonly (readonly OptionId[])[] => {
  if (!question.multiple) return question.options.map(({ id }) => [id]);
  const count = 2 ** Math.min(question.options.length, 12);
  return Array.from({ length: count }, (_, mask) =>
    question.options
      .filter((_, index) => (mask & (2 ** index)) !== 0)
      .map(({ id }) => id),
  );
};

export const selectQuestionPlugin: QuestionPlugin<
  SelectQuestion,
  readonly OptionId[]
> = {
  kind: "select",
  version: "1.0.0",
  questionSchema,
  answerSchema,
  createDefault: ({ id, text }) => ({
    kind: "select",
    id,
    text,
    options: [
      {
        id: toOptionId("opcion-1"),
        text: { key: `${text.key}.option.1`, fallback: "Opción 1" },
      },
      {
        id: toOptionId("opcion-2"),
        text: { key: `${text.key}.option.2`, fallback: "Opción 2" },
      },
    ],
  }),
  isAnswered: (_question, answer) => answer !== undefined && answer.length > 0,
  validateAnswer: (question, answer) => {
    if (new Set(answer).size !== answer.length)
      return [{ code: "duplicate-option" }];
    if (
      answer.some(
        (selected) => !question.options.some(({ id }) => id === selected),
      )
    ) {
      return [{ code: "unknown-option" }];
    }
    return question.multiple !== true && answer.length > 1
      ? [{ code: "arity-mismatch" }]
      : [];
  },
  validateQuestion: (question) => {
    const ids = question.options.map(({ id }) => id);
    const weights = question.options.map(({ weight }) => weight ?? 0);
    const positive = weights
      .filter((weight) => weight > 0)
      .reduce<number>((sum, value) => sum + value, 0);
    const negative = weights
      .filter((weight) => weight < 0)
      .reduce<number>((sum, value) => sum + value, 0);
    return [
      ...(new Set(ids).size !== ids.length
        ? [schemaIssue(question, "duplicate-option", "error")]
        : []),
      ...(!Number.isSafeInteger(positive) || !Number.isSafeInteger(negative)
        ? [schemaIssue(question, "weight-overflow-risk", "warning")]
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
      if (option === undefined) return undefined;
      total += BigInt(option.weight ?? 0);
    }
    return total >= BigInt(Number.MIN_SAFE_INTEGER) &&
      total <= BigInt(Number.MAX_SAFE_INTEGER)
      ? toSafeInt(Number(total))
      : undefined;
  },
  isSelected: (_question, answer, option) => answer.includes(option),
  probeValues: (question) => subsets(question),
  namespace: (question, { questionId, optionId }) => ({
    ...question,
    id: questionId(question.id),
    options: question.options.map((option) => ({
      ...option,
      id: optionId(option.id),
    })),
  }),
};

export type { QuestionOption as Option };
