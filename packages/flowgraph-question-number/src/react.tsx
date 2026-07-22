import {
  err,
  isSafeInt,
  toSafeInt,
  type Problem,
  type SafeInt,
} from "flowgraph-core";
import {
  ProblemMessages,
  useDraftRegistration,
  type QuestionPluginEditorProps,
  type QuestionRendererProps,
  type ReactQuestionPlugin,
} from "flowgraph-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { numberQuestionPlugin, type NumberQuestion } from "./core";

export const NumberQuestionRenderer = ({
  question,
  text,
  value,
  problems,
  disabled,
  onAnswer,
}: QuestionRendererProps<NumberQuestion>) => {
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
        {question.required === true ? " (obligatorio)" : ""}
      </label>
      <input
        ref={input}
        id={id}
        type="number"
        inputMode="numeric"
        step={1}
        min={question.min}
        max={question.max}
        value={draft}
        required={question.required === true}
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

const inputStyle = {
  width: "100%",
  minHeight: "34px",
  padding: "6px 9px",
  border: "1px solid var(--theme-elevation-200)",
  borderRadius: "var(--style-radius-s)",
  background: "var(--theme-input-bg)",
  color: "var(--theme-elevation-800)",
  fontSize: "12px",
} as const;

export const NumberQuestionEditor = ({
  question,
  disabled,
  onChange,
}: QuestionPluginEditorProps<NumberQuestion>) => {
  const updateLimit = (key: "min" | "max", value: string) => {
    const { [key]: _removed, ...rest } = question;
    onChange(
      value === "" ? rest : { ...rest, [key]: toSafeInt(Number(value)) },
    );
  };
  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}
    >
      <input
        aria-label="Mínimo"
        placeholder="Mínimo"
        type="number"
        disabled={disabled}
        style={inputStyle}
        value={question.min ?? ""}
        onChange={(event) => updateLimit("min", event.target.value)}
      />
      <input
        aria-label="Máximo"
        placeholder="Máximo"
        type="number"
        disabled={disabled}
        style={inputStyle}
        value={question.max ?? ""}
        onChange={(event) => updateLimit("max", event.target.value)}
      />
    </div>
  );
};

export const numberReactQuestionPlugin: ReactQuestionPlugin<
  NumberQuestion,
  SafeInt
> = {
  core: numberQuestionPlugin,
  label: "Número",
  QuestionRenderer: NumberQuestionRenderer,
  QuestionEditor: NumberQuestionEditor,
};
