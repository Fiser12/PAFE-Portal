import "@testing-library/jest-dom/vitest";

import { ok, toQuestionId, toSafeInt } from "flowgraph-core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createDraftRegistry } from "../../flowgraph-react/src/controller/draft-registry.js";
import { DraftRegistryContext } from "../../flowgraph-react/src/controller/internal.js";
import { numberQuestionPlugin } from "../src/core.js";
import { NumberQuestionEditor, NumberQuestionRenderer } from "../src/react.js";

const id = toQuestionId("age");
const text = { key: "age", fallback: "Edad" };

describe("number question plugin", () => {
  it("owns safe integer semantics, constraints, comparison, and probe values", () => {
    const question = {
      ...numberQuestionPlugin.createDefault({ id, text }),
      min: toSafeInt(0),
      max: toSafeInt(10),
    };
    expect(numberQuestionPlugin.answerSchema.safeParse(1.5).success).toBe(
      false,
    );
    expect(
      numberQuestionPlugin.validateAnswer(question, toSafeInt(11), "submit"),
    ).toEqual([{ code: "out-of-range" }]);
    expect(
      numberQuestionPlugin.validateQuestion?.({
        ...question,
        min: toSafeInt(11),
      })[0]?.code,
    ).toBe("invalid-constraint");
    expect(numberQuestionPlugin.numericValue?.(question, toSafeInt(4))).toBe(
      toSafeInt(4),
    );
    expect(
      numberQuestionPlugin.probeValues?.(question, { numericThresholds: [5] }),
    ).toEqual([
      toSafeInt(0),
      toSafeInt(10),
      toSafeInt(4),
      toSafeInt(5),
      toSafeInt(6),
    ]);
    expect(numberQuestionPlugin.conditions(question)).toHaveLength(2);
    expect(numberQuestionPlugin.isAnswered(question, undefined)).toBe(false);
    expect(numberQuestionPlugin.isAnswered(question, toSafeInt(0))).toBe(true);
    expect(
      numberQuestionPlugin.validateAnswer(question, toSafeInt(11), "answer"),
    ).toEqual([]);
    expect(
      numberQuestionPlugin.probeValues?.(
        numberQuestionPlugin.createDefault({ id, text }),
        { numericThresholds: [] },
      ),
    ).toEqual([toSafeInt(0)]);
    expect(
      numberQuestionPlugin.namespace?.(question, {
        questionId: () => toQuestionId("copy"),
        optionId: (option) => option,
      }).id,
    ).toBe(toQuestionId("copy"));
  });

  it("rejects unsafe raw input locally and edits both numeric limits", () => {
    const question = numberQuestionPlugin.createDefault({ id, text });
    const onAnswer = vi.fn(() => ok([]));
    render(
      <DraftRegistryContext.Provider value={createDraftRegistry()}>
        <NumberQuestionRenderer
          question={question}
          text="Edad"
          value={undefined}
          problems={[]}
          disabled={false}
          onAnswer={onAnswer}
        />
      </DraftRegistryContext.Provider>,
    );
    const input = screen.getByRole("spinbutton", { name: "Edad" });
    fireEvent.change(input, { target: { value: "9007199254740992" } });
    fireEvent.blur(input);
    expect(onAnswer).not.toHaveBeenCalled();
    expect(input).toHaveAccessibleDescription(/entero válido/i);
    fireEvent.change(input, { target: { value: "7" } });
    fireEvent.blur(input);
    expect(onAnswer).toHaveBeenCalledWith(toSafeInt(7));

    const onChange = vi.fn();
    render(
      <NumberQuestionEditor
        question={question}
        problems={[]}
        disabled={false}
        resolveText={() => undefined}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByRole("spinbutton", { name: "Mínimo" }), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Máximo" }), {
      target: { value: "8" },
    });
    expect(onChange).toHaveBeenCalledTimes(2);
  });
});
