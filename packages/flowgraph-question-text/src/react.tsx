import { toSafeInt } from "flowgraph-core";
import {
  ProblemMessages,
  useDraftRegistration,
  type QuestionPluginEditorProps,
  type QuestionRendererProps,
  type ReactQuestionPlugin,
} from "flowgraph-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import { textQuestionPlugin, type TextQuestion } from "./core";

export const TextQuestionRenderer = ({
  question,
  text,
  value,
  problems,
  disabled,
  onAnswer,
}: QuestionRendererProps<TextQuestion>) => {
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

  const change = (event: ChangeEvent<HTMLTextAreaElement>) => {
    dirty.current = true;
    setDraft(event.currentTarget.value);
  };

  return (
    <div data-flowgraph-question={question.id}>
      <label htmlFor={id}>
        {text}
        {question.required === true ? " (obligatorio)" : ""}
      </label>
      <textarea
        ref={input}
        id={id}
        value={draft}
        required={question.required === true}
        disabled={disabled}
        aria-invalid={problems.length > 0}
        aria-describedby={problems.length > 0 ? `${id}-problems` : undefined}
        onChange={change}
        onBlur={flush}
      />
      {question.maxLength === undefined ? null : (
        <small>
          {Array.from(draft).length}/{question.maxLength}
        </small>
      )}
      <ProblemMessages id={`${id}-problems`} problems={problems} />
    </div>
  );
};

const editorInputStyle = {
  width: "100%",
  minHeight: "34px",
  padding: "6px 9px",
  border: "1px solid var(--theme-elevation-200)",
  borderRadius: "var(--style-radius-s)",
  background: "var(--theme-input-bg)",
  color: "var(--theme-elevation-800)",
  fontSize: "12px",
} as const;

export const TextQuestionEditor = ({
  question,
  disabled,
  onChange,
}: QuestionPluginEditorProps<TextQuestion>) => (
  <label
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 90px",
      alignItems: "center",
    }}
  >
    <span style={{ fontSize: "11px" }}>Longitud máxima</span>
    <input
      type="number"
      min={0}
      disabled={disabled}
      style={editorInputStyle}
      value={question.maxLength ?? ""}
      onChange={(event) => {
        const { maxLength: _removed, ...withoutMaximum } = question;
        onChange(
          event.target.value === ""
            ? withoutMaximum
            : {
                ...withoutMaximum,
                maxLength: toSafeInt(Number(event.target.value)),
              },
        );
      }}
    />
  </label>
);

export const textReactQuestionPlugin: ReactQuestionPlugin<
  TextQuestion,
  string
> = {
  core: textQuestionPlugin,
  label: "Texto",
  QuestionRenderer: TextQuestionRenderer,
  QuestionEditor: TextQuestionEditor,
};
