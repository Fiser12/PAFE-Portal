import "@testing-library/jest-dom/vitest";

import { ok, toQuestionId, toSafeInt } from "flowgraph-core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createDraftRegistry } from "../../flowgraph-react/src/controller/draft-registry.js";
import { DraftRegistryContext } from "../../flowgraph-react/src/controller/internal.js";
import { textQuestionPlugin } from "../src/core.js";
import { TextQuestionEditor, TextQuestionRenderer } from "../src/react.js";

const id = toQuestionId("notes");
const text = { key: "notes", fallback: "Notas" };

describe("text question plugin", () => {
  it("owns parsing, defaults, validation, and graph capabilities", () => {
    const question = textQuestionPlugin.createDefault({ id, text });
    expect(question.maxLength).toBe(toSafeInt(500));
    expect(textQuestionPlugin.questionSchema.safeParse(question).success).toBe(
      true,
    );
    expect(
      textQuestionPlugin.questionSchema.safeParse({
        ...question,
        maxLength: -1,
      }).success,
    ).toBe(false);
    expect(textQuestionPlugin.isAnswered(question, "")).toBe(false);
    expect(textQuestionPlugin.isAnswered(question, "ok")).toBe(true);
    expect(
      textQuestionPlugin.validateAnswer(
        { ...question, maxLength: toSafeInt(2) },
        "tres",
        "submit",
      ),
    ).toEqual([{ code: "too-long" }]);
    expect(
      textQuestionPlugin.validateAnswer(question, "tres", "answer"),
    ).toEqual([]);
    expect(textQuestionPlugin.conditions(question)).toEqual([
      { kind: "answered" },
    ]);
    expect(
      textQuestionPlugin.validateQuestion?.({
        ...question,
        maxLength: toSafeInt(-1),
      })[0]?.code,
    ).toBe("invalid-constraint");
    expect(
      textQuestionPlugin.probeValues?.(question, { numericThresholds: [] }),
    ).toEqual(["x"]);
    expect(
      textQuestionPlugin.namespace?.(question, {
        questionId: () => toQuestionId("copy"),
        optionId: (option) => option,
      }).id,
    ).toBe(toQuestionId("copy"));
  });

  it("renders and commits a draft, while its editor changes plugin configuration", () => {
    const question = textQuestionPlugin.createDefault({ id, text });
    const onAnswer = vi.fn(() => ok([]));
    const registry = createDraftRegistry();
    render(
      <DraftRegistryContext.Provider value={registry}>
        <TextQuestionRenderer
          question={question}
          text="Notas"
          value={undefined}
          problems={[]}
          disabled={false}
          onAnswer={onAnswer}
        />
      </DraftRegistryContext.Provider>,
    );
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Contenido" },
    });
    fireEvent.blur(screen.getByRole("textbox"));
    expect(onAnswer).toHaveBeenCalledWith("Contenido");

    const onChange = vi.fn();
    render(
      <TextQuestionEditor
        question={question}
        problems={[]}
        disabled={false}
        resolveText={() => undefined}
        onChange={onChange}
      />,
    );
    fireEvent.change(screen.getByRole("spinbutton"), {
      target: { value: "80" },
    });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ maxLength: 80 }),
    );
  });
});
