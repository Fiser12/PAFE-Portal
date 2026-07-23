import { z } from "zod";

import {
  createFlowGraphRuntime,
  createQuestionPluginRegistry,
  guardWireSchema,
  nonEmptyStringSchema,
  textRefSchema,
  type OptionId,
  type QuestionDefinition,
  type QuestionOption,
  type QuestionPlugin,
} from "flowgraph-core";
import { createSession as createFlowSession } from "../src/index.js";

export * from "flowgraph-core";

type SelectQuestion = QuestionDefinition & {
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

const selectPlugin: QuestionPlugin<SelectQuestion, readonly OptionId[]> = {
  kind: "select",
  version: "test",
  questionSchema: z.strictObject({
    kind: z.literal("select"),
    id: nonEmptyStringSchema,
    text: textRefSchema,
    required: z.boolean().optional(),
    visibleWhen: guardWireSchema.optional(),
    multiple: z.boolean().optional(),
    options: z.array(
      z.strictObject({ id: nonEmptyStringSchema, text: textRefSchema }),
    ),
  }) as unknown as z.ZodType<SelectQuestion>,
  answerSchema: z.array(nonEmptyStringSchema) as unknown as z.ZodType<
    readonly OptionId[]
  >,
  createDefault: ({ id, text }) => ({ kind: "select", id, text, options: [] }),
  isAnswered: (_question, answer) => answer !== undefined && answer.length > 0,
  validateAnswer: () => [],
  conditions: (question) => [
    { kind: "answered" },
    { kind: "selected", options: question.options },
  ],
  isSelected: (_question, answer, option) => answer.includes(option),
  namespace: (question, { questionId, optionId }) => ({
    ...question,
    id: questionId(question.id),
    options: question.options.map((option) => ({
      ...option,
      id: optionId(option.id),
    })),
  }),
};

export const runtime = createFlowGraphRuntime(
  createQuestionPluginRegistry([selectPlugin]),
);

export const compileComposition = runtime.compileComposition;
export const replay = runtime.replay;
export const decide = runtime.decide;
export const activeAnswers = runtime.activeAnswers;

export const createSession = (
  schema: Parameters<typeof createFlowSession>[1],
  events?: Parameters<typeof createFlowSession>[2],
  options?: Parameters<typeof createFlowSession>[3],
) => createFlowSession(runtime, schema, events, options);
