import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  createQuestionPluginRegistry,
  QuestionPluginRegistryError,
  toQuestionId,
  type QuestionPlugin,
  type QuestionPluginQuestion,
} from "../../src/index";

type ToggleQuestion = QuestionPluginQuestion & {
  readonly kind: "toggle";
};

const togglePlugin: QuestionPlugin<ToggleQuestion, boolean> = {
  kind: "toggle",
  version: "1.0.0",
  questionSchema: z.object({
    id: z.string().transform(toQuestionId),
    kind: z.literal("toggle"),
    text: z.strictObject({ key: z.string(), fallback: z.string() }),
  }),
  answerSchema: z.boolean(),
  createDefault: ({ id, text }) => ({ id, kind: "toggle", text }),
  isAnswered: (_question, answer) => answer !== undefined,
  validateAnswer: () => [],
  conditions: () => [{ kind: "answered" }],
  probeValues: () => [false, true],
};

describe("question plugin registry", () => {
  it("registers and retrieves plugins by their persisted kind", () => {
    const registry = createQuestionPluginRegistry([togglePlugin]);

    expect(registry.get("toggle")).toBe(togglePlugin);
    expect(registry.has("toggle")).toBe(true);
    expect(registry.list()).toEqual([togglePlugin]);
  });

  it("rejects duplicate kinds", () => {
    expect(() =>
      createQuestionPluginRegistry([togglePlugin, togglePlugin]),
    ).toThrowError(QuestionPluginRegistryError);
  });

  it("rejects unstable blank or padded identifiers", () => {
    expect(() =>
      createQuestionPluginRegistry([{ ...togglePlugin, kind: " toggle" }]),
    ).toThrowError("invalid-plugin-kind");
    expect(() =>
      createQuestionPluginRegistry([{ ...togglePlugin, version: " " }]),
    ).toThrowError("invalid-plugin-version");
  });
});
