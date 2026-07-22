import {
  toOptionId,
  toSafeInt,
  type OptionId,
  type QuestionOption,
} from "flowgraph-core";
import {
  ProblemMessages,
  useDraftRegistration,
  type QuestionPluginEditorProps,
  type QuestionRendererProps,
  type ReactQuestionPlugin,
} from "flowgraph-react";
import { useCallback, useId, useMemo, useRef } from "react";

import { selectQuestionPlugin, type SelectQuestion } from "./core";

export const SelectQuestionRenderer = ({
  question,
  text,
  options = [],
  value,
  problems,
  disabled,
  onAnswer,
}: QuestionRendererProps<SelectQuestion>) => {
  const id = useId();
  const firstInput = useRef<HTMLInputElement>(null);
  const pointerSelection = useRef<OptionId | undefined>(undefined);
  const selected = useMemo(
    () => new Set(Array.isArray(value) ? value : []),
    [value],
  );
  useDraftRegistration(
    question.id,
    useCallback(() => false, []),
    useCallback(() => ({ ok: true as const, value: [] }), []),
    useCallback(() => firstInput.current?.focus(), []),
  );

  const activate = (option: OptionId, multiple: boolean) => {
    if (!multiple) return void onAnswer([option]);
    const changed = new Set(selected);
    if (changed.has(option)) changed.delete(option);
    else changed.add(option);
    onAnswer(
      question.options
        .map(({ id: optionId }) => optionId)
        .filter((item) => changed.has(item)),
    );
  };

  return (
    <fieldset
      disabled={disabled}
      aria-invalid={problems.length > 0}
      aria-describedby={problems.length > 0 ? `${id}-problems` : undefined}
      data-flowgraph-question={question.id}
    >
      <legend>
        {text}
        {question.required === true ? " (obligatorio)" : ""}
      </legend>
      {options.map((option, index) => {
        const optionInputId = `${id}-${String(index)}`;
        const multiple = question.multiple === true;
        return (
          <div key={option.id}>
            <input
              ref={index === 0 ? firstInput : undefined}
              id={optionInputId}
              type={multiple ? "checkbox" : "radio"}
              name={id}
              value={option.id}
              checked={selected.has(option.id)}
              onChange={() => {
                if (pointerSelection.current === option.id) {
                  pointerSelection.current = undefined;
                  return;
                }
                activate(option.id, multiple);
              }}
              onMouseDown={(event) => {
                if (event.button !== 0) return;
                pointerSelection.current = option.id;
                globalThis.setTimeout(() => {
                  pointerSelection.current = undefined;
                }, 0);
                activate(option.id, multiple);
              }}
            />
            <label htmlFor={optionInputId}>{option.text}</label>
          </div>
        );
      })}
      <ProblemMessages id={`${id}-problems`} problems={problems} />
    </fieldset>
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
const buttonStyle = {
  minHeight: "32px",
  padding: "5px 10px",
  border: "1px solid var(--theme-elevation-250)",
  borderRadius: "var(--style-radius-s)",
  background: "var(--theme-elevation-100)",
  color: "var(--theme-elevation-800)",
  cursor: "pointer",
  fontSize: "12px",
} as const;

export const SelectQuestionEditor = ({
  question,
  disabled,
  onChange,
}: QuestionPluginEditorProps<SelectQuestion>) => {
  const updateOption = (index: number, option: QuestionOption) => {
    const options = [...question.options];
    options[index] = option;
    onChange({ ...question, options });
  };
  return (
    <div style={{ display: "grid", gap: "6px" }}>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          fontSize: "11px",
        }}
      >
        <input
          type="checkbox"
          disabled={disabled}
          checked={question.multiple ?? false}
          onChange={(event) =>
            onChange({ ...question, multiple: event.target.checked })
          }
        />{" "}
        Múltiple
      </label>
      {question.options.map((option, index) => (
        <div
          key={option.id}
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 55px auto",
            gap: "5px",
          }}
        >
          <input
            aria-label={`Opción ${option.id}`}
            disabled={disabled}
            style={inputStyle}
            value={option.text.fallback}
            onChange={(event) =>
              updateOption(index, {
                ...option,
                text: { ...option.text, fallback: event.target.value },
              })
            }
          />
          <input
            aria-label={`Peso ${option.id}`}
            disabled={disabled}
            type="number"
            style={inputStyle}
            value={option.weight ?? 0}
            onChange={(event) =>
              updateOption(index, {
                ...option,
                weight: toSafeInt(Number(event.target.value)),
              })
            }
          />
          <button
            type="button"
            disabled={disabled}
            style={buttonStyle}
            onClick={() =>
              onChange({
                ...question,
                options: question.options.filter(
                  (_, optionIndex) => optionIndex !== index,
                ),
              })
            }
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={disabled}
        style={buttonStyle}
        onClick={() => {
          let sequence = question.options.length + 1;
          let id = toOptionId(`opcion-${String(sequence)}`);
          while (question.options.some((option) => option.id === id)) {
            sequence += 1;
            id = toOptionId(`opcion-${String(sequence)}`);
          }
          onChange({
            ...question,
            options: [
              ...question.options,
              {
                id,
                text: {
                  key: `${question.text.key}.option.${id}`,
                  fallback: "Nueva opción",
                },
                weight: toSafeInt(0),
              },
            ],
          });
        }}
      >
        + Opción
      </button>
    </div>
  );
};

export const selectReactQuestionPlugin: ReactQuestionPlugin<
  SelectQuestion,
  readonly OptionId[]
> = {
  core: selectQuestionPlugin,
  label: "Selección",
  QuestionRenderer: SelectQuestionRenderer,
  QuestionEditor: SelectQuestionEditor,
};
