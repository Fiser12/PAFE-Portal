import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  createFlowGraphRuntime,
  createQuestionPluginRegistry,
  nonEmptyStringSchema,
  textRefSchema,
  type QuestionDefinition,
  type QuestionPlugin,
} from "../support/runtime.js";

// A "rating" question whose persisted shape changed across versions, used as a
// compatibility fixture: v1 stored `max`, v2 renamed it to `scale` and added a
// required `min`. The upcaster is the pure bridge the framework chains.
type RatingQuestion = QuestionDefinition & {
  readonly kind: "rating";
  readonly min: number;
  readonly scale: number;
};

const ratingSchemaV2 = z.strictObject({
  kind: z.literal("rating"),
  id: nonEmptyStringSchema,
  text: textRefSchema,
  required: z.boolean().optional(),
  min: z.number(),
  scale: z.number(),
}) as unknown as z.ZodType<RatingQuestion>;

const ratingBase = {
  kind: "rating" as const,
  questionSchema: ratingSchemaV2,
  answerSchema: z.number(),
  createDefault: ({ id, text }: { id: string; text: { key: string; fallback: string } }) =>
    ({ kind: "rating", id, text, min: 1, scale: 5 }) as RatingQuestion,
  isAnswered: (_q: RatingQuestion, answer: number | undefined) => answer !== undefined,
  validateAnswer: () => [],
  conditions: () => [{ kind: "answered" as const }],
} satisfies Partial<QuestionPlugin<RatingQuestion, number>>;

const ratingV2: QuestionPlugin<RatingQuestion, number> = {
  ...ratingBase,
  version: "2.0.0",
  upcasters: [
    {
      from: "1.0.0",
      to: "2.0.0",
      upcast: (question) => {
        const { max, ...rest } = question as Record<string, unknown>;
        return { ...rest, min: 1, scale: typeof max === "number" ? max : 5 };
      },
    },
  ],
} as unknown as QuestionPlugin<RatingQuestion, number>;

// Same current version but no upcasters: exercises the same-major passthrough.
const ratingV1_1: QuestionPlugin<RatingQuestion, number> = {
  ...ratingBase,
  version: "1.1.0",
} as unknown as QuestionPlugin<RatingQuestion, number>;

const runtimeWith = (plugin: QuestionPlugin<RatingQuestion, number>) =>
  createFlowGraphRuntime(createQuestionPluginRegistry([plugin]));

const schemaWith = (
  manifestVersion: string,
  question: Record<string, unknown>,
) => ({
  id: "survey",
  version: "1",
  questionPlugins: { rating: manifestVersion },
  entry: "page",
  nodes: {
    page: {
      kind: "page",
      questions: [question],
      edges: [{ to: "done", when: { kind: "always" } }],
    },
    done: { kind: "terminal", outcome: "submitted" },
  },
});

const v1Question = {
  kind: "rating",
  id: "mood",
  text: { key: "mood", fallback: "Mood" },
  max: 7,
};

describe("plugin evolution — schema upcasting", () => {
  it("migrates a persisted v1 question up to the installed v2 shape", () => {
    const result = runtimeWith(ratingV2).parseSchema(schemaWith("1.0.0", v1Question));

    expect(result.ok).toBe(true);
    if (result.ok) {
      const page = result.value.nodes.page;
      const question = page?.kind === "page" ? page.questions[0] : undefined;
      // v1 `max: 7` became v2 `scale: 7` with the added `min`; the manifest is
      // rewritten to the installed version.
      expect(question).toMatchObject({ kind: "rating", min: 1, scale: 7 });
      expect(question).not.toHaveProperty("max");
      expect(result.value.questionPlugins).toEqual({ rating: "2.0.0" });
    }
  });

  it("keeps the exact-version happy path unchanged", () => {
    const current = {
      kind: "rating",
      id: "mood",
      text: { key: "mood", fallback: "Mood" },
      min: 1,
      scale: 5,
    };
    const result = runtimeWith(ratingV2).parseSchema(schemaWith("2.0.0", current));

    expect(result.ok).toBe(true);
  });

  it("accepts a same-major bump without an upcaster (additive change)", () => {
    const result = runtimeWith(ratingV1_1).parseSchema(
      schemaWith("1.0.0", {
        kind: "rating",
        id: "mood",
        text: { key: "mood", fallback: "Mood" },
        min: 1,
        scale: 5,
      }),
    );

    expect(result.ok).toBe(true);
  });

  it("rejects an incompatible cross-major version with no upcaster path", () => {
    // Installed v2 with no chain reaching an unknown "0.9.0"; different major.
    const orphan = { ...ratingV2, upcasters: [] } as unknown as QuestionPlugin<
      RatingQuestion,
      number
    >;
    const result = runtimeWith(orphan).parseSchema(schemaWith("0.9.0", v1Question));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error[0]?.code).toBe("invalid-wire-value");
    }
  });

  it("rejects a persisted version newer than the installed plugin", () => {
    const result = runtimeWith(ratingV2).parseSchema(
      schemaWith("3.0.0", {
        kind: "rating",
        id: "mood",
        text: { key: "mood", fallback: "Mood" },
        min: 1,
        scale: 5,
      }),
    );

    // Same major would pass; a higher major with no downcast path must not.
    expect(result.ok).toBe(false);
  });
});
