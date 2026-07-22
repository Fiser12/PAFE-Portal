import {
  createFlowGraphRuntime,
  createQuestionPluginRegistry,
  err,
  guardWireSchema,
  isSafeInt,
  nonEmptyStringSchema,
  safeIntSchema,
  textRefSchema,
  toOptionId,
  toSafeInt,
  type OptionId,
  type Problem,
  type QuestionDefinition,
  type QuestionOption,
  type QuestionPlugin,
  type SafeInt,
} from "flowgraph-core";
import { z } from "zod";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import {
  createReactQuestionPluginRegistry,
  type ReactQuestionPlugin,
} from "../../src/plugins/question-plugin.js";
import { useDraftRegistration } from "../../src/renderers/use-draft-registration.js";
import type { QuestionRendererProps } from "../../src/types.js";
import { ProblemMessages } from "../../src/view/problem-messages.js";

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

declare module "flowgraph-core" {
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
  conditions: () => [
    { kind: "answered" },
    {
      kind: "compare",
      source: "answer",
      operators: ["eq", "ne", "lt", "lte", "gt", "gte"],
    },
  ],
  numericValue: (_question, answer) => answer,
  probeValues: () => [toSafeInt(0)],
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
  validateAnswer: (question, answer) =>
    answer.some((id) => !question.options.some((option) => option.id === id))
      ? [{ code: "unknown-option" }]
      : [],
  conditions: (question) => [
    { kind: "answered" },
    { kind: "selected", options: question.options },
  ],
  isSelected: (_question, answer, option) => answer.includes(option),
  probeValues: (question) => question.options.map(({ id }) => [id]),
  namespace: (question, { questionId, optionId }) => ({
    ...question,
    id: questionId(question.id),
    options: question.options.map((option) => ({
      ...option,
      id: optionId(option.id),
    })),
  }),
};

export const TestTextRenderer = ({
  question,
  text,
  value,
  problems,
  disabled,
  onAnswer,
}: QuestionRendererProps<TestTextQuestion>) => {
  const id = useId();
  const input = useRef<HTMLTextAreaElement>(null);
  const dirty = useRef(false);
  const [draft, setDraft] = useState(typeof value === "string" ? value : "");
  useEffect(() => {
    if (!dirty.current) setDraft(typeof value === "string" ? value : "");
  }, [value]);
  const flush = useCallback(() => {
    if (!dirty.current) return { ok: true as const, value: [] };
    const result = onAnswer(draft);
    if (result.ok) dirty.current = false;
    return result;
  }, [draft, onAnswer]);
  useDraftRegistration(
    question.id,
    useCallback(() => dirty.current, []),
    flush,
    useCallback(() => input.current?.focus(), []),
  );
  return (
    <div data-flowgraph-question={question.id}>
      <label htmlFor={id}>
        {text}
        {question.required ? " (obligatorio)" : ""}
      </label>
      <textarea
        ref={input}
        id={id}
        value={draft}
        required={question.required}
        disabled={disabled}
        aria-invalid={problems.length > 0}
        aria-describedby={problems.length > 0 ? `${id}-problems` : undefined}
        onChange={(event) => {
          dirty.current = true;
          setDraft(event.currentTarget.value);
        }}
        onBlur={flush}
      />
      <ProblemMessages id={`${id}-problems`} problems={problems} />
    </div>
  );
};

export const TestNumberRenderer = ({
  question,
  text,
  value,
  problems,
  disabled,
  onAnswer,
}: QuestionRendererProps<TestNumberQuestion>) => {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const dirty = useRef(false);
  const [draft, setDraft] = useState(
    typeof value === "number" ? String(value) : "",
  );
  const [localProblems, setLocalProblems] = useState<readonly Problem[]>([]);
  useEffect(() => {
    if (!dirty.current)
      setDraft(typeof value === "number" ? String(value) : "");
  }, [value]);
  const flush = useCallback(() => {
    if (!dirty.current) return { ok: true as const, value: [] };
    const numeric = Number(draft);
    if (!/^-?(0|[1-9]\d*)$/.test(draft) || !isSafeInt(numeric)) {
      const invalid: Problem = {
        code: "answer-kind-mismatch",
        where: { q: question.id },
      };
      setLocalProblems([invalid]);
      return err([invalid]);
    }
    const result = onAnswer(toSafeInt(numeric));
    if (result.ok) {
      dirty.current = false;
      setLocalProblems([]);
    }
    return result;
  }, [draft, onAnswer, question.id]);
  useDraftRegistration(
    question.id,
    useCallback(() => dirty.current, []),
    flush,
    useCallback(() => input.current?.focus(), []),
  );
  const visibleProblems = [...localProblems, ...problems];
  return (
    <div data-flowgraph-question={question.id}>
      <label htmlFor={id}>
        {text}
        {question.required ? " (obligatorio)" : ""}
      </label>
      <input
        ref={input}
        id={id}
        type="number"
        inputMode="numeric"
        step={1}
        value={draft}
        min={question.min}
        max={question.max}
        required={question.required}
        disabled={disabled}
        aria-invalid={visibleProblems.length > 0}
        aria-describedby={
          visibleProblems.length > 0 ? `${id}-problems` : undefined
        }
        onChange={(event) => {
          dirty.current = true;
          setDraft(event.currentTarget.value);
          setLocalProblems([]);
        }}
        onBlur={flush}
      />
      <ProblemMessages id={`${id}-problems`} problems={visibleProblems} />
    </div>
  );
};

export const TestSelectRenderer = ({
  question,
  text,
  options = [],
  value,
  problems,
  disabled,
  onAnswer,
}: QuestionRendererProps<TestSelectQuestion>) => {
  const selected = Array.isArray(value) ? value : [];
  const id = useId();
  return (
    <fieldset
      data-flowgraph-question={question.id}
      disabled={disabled}
      aria-invalid={problems.length > 0}
      aria-describedby={problems.length > 0 ? `${id}-problems` : undefined}
    >
      <legend>
        {text}
        {question.required ? " (obligatorio)" : ""}
      </legend>
      {options.map((option) => (
        <label key={option.id}>
          <input
            type={question.multiple ? "checkbox" : "radio"}
            name={question.id}
            checked={selected.includes(option.id)}
            onChange={(event) =>
              onAnswer(
                question.multiple
                  ? event.currentTarget.checked
                    ? [...selected, option.id]
                    : selected.filter((id) => id !== option.id)
                  : [option.id],
              )
            }
          />
          {option.text}
        </label>
      ))}
      <ProblemMessages id={`${id}-problems`} problems={problems} />
    </fieldset>
  );
};

const EmptyEditor = () => null;

export const testRuntime = createFlowGraphRuntime(
  createQuestionPluginRegistry([textPlugin, numberPlugin, selectPlugin]),
);
export const testQuestionPlugins = createReactQuestionPluginRegistry(
  testRuntime,
  [
    {
      core: textPlugin,
      label: "Text",
      QuestionRenderer: TestTextRenderer,
      QuestionEditor: EmptyEditor,
    } satisfies ReactQuestionPlugin<TestTextQuestion, string>,
    {
      core: numberPlugin,
      label: "Number",
      QuestionRenderer: TestNumberRenderer,
      QuestionEditor: EmptyEditor,
    } satisfies ReactQuestionPlugin<TestNumberQuestion, SafeInt>,
    {
      core: selectPlugin,
      label: "Select",
      QuestionRenderer: TestSelectRenderer,
      QuestionEditor: EmptyEditor,
    } satisfies ReactQuestionPlugin<TestSelectQuestion, readonly OptionId[]>,
  ],
);
