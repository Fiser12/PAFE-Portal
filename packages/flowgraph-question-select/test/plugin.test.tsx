import "@testing-library/jest-dom/vitest";

import { ok, toOptionId, toQuestionId, toSafeInt } from "flowgraph-core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createDraftRegistry } from "../../flowgraph-react/src/controller/draft-registry.js";
import { DraftRegistryContext } from "../../flowgraph-react/src/controller/internal.js";
import { selectQuestionPlugin } from "../src/core.js";
import { SelectQuestionEditor, SelectQuestionRenderer } from "../src/react.js";

const id = toQuestionId("reason");
const text = { key: "reason", fallback: "Motivo" };

describe("select question plugin", () => {
  it("owns options, answer integrity, conditions, score, and finite probing", () => {
    const question = {
      ...selectQuestionPlugin.createDefault({ id, text }),
      options: [
        {
          id: toOptionId("a"),
          text: { key: "a", fallback: "A" },
          weight: toSafeInt(2),
        },
        {
          id: toOptionId("b"),
          text: { key: "b", fallback: "B" },
          weight: toSafeInt(3),
        },
      ],
    };
    expect(
      selectQuestionPlugin.answerSchema.safeParse([
        toOptionId("a"),
        toOptionId("a"),
      ]).success,
    ).toBe(false);
    expect(
      selectQuestionPlugin.validateAnswer(
        question,
        [toOptionId("missing")],
        "answer",
      ),
    ).toEqual([{ code: "unknown-option" }]);
    expect(
      selectQuestionPlugin.validateAnswer(
        question,
        [toOptionId("a"), toOptionId("b")],
        "answer",
      ),
    ).toEqual([{ code: "arity-mismatch" }]);
    expect(
      selectQuestionPlugin.score?.(question, [
        toOptionId("a"),
        toOptionId("b"),
      ]),
    ).toBe(toSafeInt(5));
    expect(
      selectQuestionPlugin.isSelected?.(
        question,
        [toOptionId("b")],
        toOptionId("b"),
      ),
    ).toBe(true);
    expect(
      selectQuestionPlugin.conditions(question).map(({ kind }) => kind),
    ).toEqual(["answered", "selected", "compare"]);
    expect(
      selectQuestionPlugin.probeValues?.(question, { numericThresholds: [] }),
    ).toEqual([[toOptionId("a")], [toOptionId("b")]]);
    expect(
      selectQuestionPlugin.validateAnswer(
        question,
        [toOptionId("a"), toOptionId("a")],
        "answer",
      ),
    ).toEqual([{ code: "duplicate-option" }]);
    expect(selectQuestionPlugin.isAnswered(question, [])).toBe(false);
    expect(
      selectQuestionPlugin.score?.(question, [toOptionId("missing")]),
    ).toBeUndefined();
    expect(
      selectQuestionPlugin.validateQuestion?.({
        ...question,
        options: [question.options[0]!, question.options[0]!],
      })[0]?.code,
    ).toBe("duplicate-option");
    expect(
      selectQuestionPlugin.probeValues?.(
        { ...question, multiple: true },
        { numericThresholds: [] },
      ),
    ).toHaveLength(4);
    expect(
      selectQuestionPlugin.namespace?.(question, {
        questionId: () => toQuestionId("copy"),
        optionId: (option) => toOptionId(`copy-${option}`),
      }).id,
    ).toBe(toQuestionId("copy"));
  });

  it("renders an option selection and edits the option list", () => {
    const question = selectQuestionPlugin.createDefault({ id, text });
    const options = question.options.map((option) => ({
      id: option.id,
      text: option.text.fallback,
    }));
    const onAnswer = vi.fn(() => ok([]));
    render(
      <DraftRegistryContext.Provider value={createDraftRegistry()}>
        <SelectQuestionRenderer
          question={question}
          text="Motivo"
          options={options}
          value={undefined}
          problems={[]}
          disabled={false}
          onAnswer={onAnswer}
        />
      </DraftRegistryContext.Provider>,
    );
    fireEvent.click(screen.getByRole("radio", { name: "Opción 1" }));
    expect(onAnswer).toHaveBeenCalledWith([toOptionId("opcion-1")]);

    const onChange = vi.fn();
    render(
      <SelectQuestionEditor
        question={question}
        problems={[]}
        disabled={false}
        resolveText={() => undefined}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "+ Opción" }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.arrayContaining([
          expect.objectContaining({ id: toOptionId("opcion-3") }),
        ]),
      }),
    );
    fireEvent.click(screen.getByRole("checkbox", { name: /múltiple/i }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ multiple: true }),
    );
  });
});
