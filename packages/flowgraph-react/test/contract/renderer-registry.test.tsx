import { toNodeId, type Question, type QuestionId } from "flowgraph-core";
import { describe, expect, it } from "vitest";

import type { QuestionRenderer, RendererRegistry } from "../../src/types.js";
import { createReactQuestionPluginRegistry } from "../../src/plugins/question-plugin.js";
import { resolveQuestionRenderer } from "../../src/renderers/renderer-registry.js";
import { qName, qReason, surveySchema } from "../support/builders.js";
import { testQuestionPlugins, testRuntime } from "../support/plugins.js";

const RendererA: QuestionRenderer = () => null;
const RendererB: QuestionRenderer = () => null;

const question = (id: QuestionId): Question => {
  const node = surveySchema().nodes[toNodeId("profile")];
  const found =
    node?.kind === "page"
      ? node.questions.find((item) => item.id === id)
      : undefined;
  if (!found) throw new Error("Renderer fixture question is missing");
  return found;
};

describe("resolveQuestionRenderer", () => {
  it("uses the registered plugin renderer when no override matches", () => {
    const definition = question(qName);
    expect(resolveQuestionRenderer(definition, testQuestionPlugins)).toBe(
      testQuestionPlugins.get("text")?.QuestionRenderer,
    );
  });

  it("uses kind overrides and gives question-id overrides precedence", () => {
    const registry: RendererRegistry = {
      byKind: { text: RendererA },
      byId: { [qName]: RendererB },
    };

    expect(
      resolveQuestionRenderer(question(qReason), testQuestionPlugins, registry),
    ).toBe(testQuestionPlugins.get("select")?.QuestionRenderer);
    expect(
      resolveQuestionRenderer(question(qName), testQuestionPlugins, {
        byKind: { text: RendererA },
      }),
    ).toBe(RendererA);
    expect(
      resolveQuestionRenderer(question(qName), testQuestionPlugins, registry),
    ).toBe(RendererB);
  });

  it("does not mutate frozen registry configuration", () => {
    const registry = Object.freeze({
      byKind: Object.freeze({ text: RendererA }),
      byId: Object.freeze({}),
    }) satisfies RendererRegistry;

    expect(
      resolveQuestionRenderer(question(qName), testQuestionPlugins, registry),
    ).toBe(RendererA);
    expect(Object.isFrozen(registry.byKind)).toBe(true);
  });

  it("throws a developer-facing error when no renderer can be resolved", () => {
    const definition = question(qName);
    expect(() =>
      resolveQuestionRenderer(
        { ...definition, kind: "missing" } as unknown as Question,
        testQuestionPlugins,
      ),
    ).toThrow(
      `No renderer configured for question "${qName}" of kind "missing"`,
    );
  });

  it("fails closed for mismatched, duplicated, or missing React plugin adapters", () => {
    const plugins = testQuestionPlugins.list();
    const first = plugins[0];
    if (!first) throw new Error("Plugin fixture is missing");
    expect(() =>
      createReactQuestionPluginRegistry(testRuntime, [
        { ...first, core: { ...first.core, version: "other" } },
        ...plugins.slice(1),
      ]),
    ).toThrow(/does not match runtime/i);
    expect(() =>
      createReactQuestionPluginRegistry(testRuntime, [
        first,
        first,
        ...plugins.slice(1),
      ]),
    ).toThrow(/duplicate/i);
    expect(() =>
      createReactQuestionPluginRegistry(testRuntime, plugins.slice(1)),
    ).toThrow(/missing/i);
    expect(testQuestionPlugins.get("missing")).toBeUndefined();
    expect(testQuestionPlugins.list()).toBe(testQuestionPlugins.list());
  });
});
