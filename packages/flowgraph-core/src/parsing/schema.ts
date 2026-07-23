import { z } from "zod";

import type { FlowSchema } from "../domain/schema";
import type { ParseProblem } from "../domain/problem";
import { err, ok, type Result } from "../domain/result";
import type { QuestionPluginRegistry } from "../plugins/question-plugin";
import {
  nonEmptyStringSchema,
  safeIntSchema,
  textRefSchema,
  toParseProblems,
} from "./shared";
import { upcastSchema } from "./upcast-schema";

export const numericExprWireSchema: z.ZodType = z.lazy(() =>
  z.discriminatedUnion("kind", [
    z.strictObject({ kind: z.literal("num"), value: safeIntSchema }),
    z.strictObject({ kind: z.literal("answer"), q: nonEmptyStringSchema }),
    z.strictObject({ kind: z.literal("score"), q: nonEmptyStringSchema }),
    z.strictObject({
      kind: z.literal("sum"),
      values: z.array(numericExprWireSchema),
    }),
  ]),
);

export const guardWireSchema: z.ZodType = z.lazy(() =>
  z.discriminatedUnion("kind", [
    z.strictObject({ kind: z.literal("always") }),
    z.strictObject({ kind: z.literal("answered"), q: nonEmptyStringSchema }),
    z.strictObject({
      kind: z.literal("selected"),
      q: nonEmptyStringSchema,
      option: nonEmptyStringSchema,
    }),
    z.strictObject({ kind: z.literal("not"), value: guardWireSchema }),
    z.strictObject({
      kind: z.literal("all"),
      values: z.array(guardWireSchema),
    }),
    z.strictObject({
      kind: z.literal("any"),
      values: z.array(guardWireSchema),
    }),
    z.strictObject({
      kind: z.literal("cmp"),
      op: z.enum(["eq", "ne", "lt", "lte", "gt", "gte"]),
      left: numericExprWireSchema,
      right: numericExprWireSchema,
    }),
  ]),
);

const questionSchema = (plugins: QuestionPluginRegistry) =>
  z.unknown().transform((value, context) => {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      context.addIssue({
        code: "custom",
        message: "Question must be an object",
      });
      return z.NEVER;
    }
    const kind = (value as Readonly<Record<string, unknown>>).kind;
    if (typeof kind !== "string") {
      context.addIssue({
        code: "custom",
        message: "Question kind must be a string",
        path: ["kind"],
      });
      return z.NEVER;
    }
    const plugin = plugins.get(kind);
    if (plugin === undefined) {
      context.addIssue({
        code: "custom",
        message: `Question plugin is not registered: ${kind}`,
      });
      return z.NEVER;
    }
    const parsed = plugin.questionSchema.safeParse(value);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) =>
        context.addIssue({
          code: "custom",
          message: issue.message,
          path: [...issue.path],
        }),
      );
      return z.NEVER;
    }
    return parsed.data;
  });

const edgeSchema = z.strictObject({
  to: nonEmptyStringSchema,
  when: guardWireSchema,
});

export const nodeWireSchema = (plugins: QuestionPluginRegistry) =>
  z.discriminatedUnion("kind", [
    z.strictObject({
      kind: z.literal("page"),
      title: textRefSchema.optional(),
      questions: z.array(questionSchema(plugins)),
      edges: z.array(edgeSchema),
    }),
    z.strictObject({
      kind: z.literal("terminal"),
      outcome: nonEmptyStringSchema,
    }),
  ]);

const flowSchema = (plugins: QuestionPluginRegistry) =>
  z.strictObject({
    id: nonEmptyStringSchema,
    version: nonEmptyStringSchema,
    questionPlugins: z
      .record(nonEmptyStringSchema, nonEmptyStringSchema)
      .optional(),
    entry: nonEmptyStringSchema,
    nodes: z.record(nonEmptyStringSchema, nodeWireSchema(plugins)),
  });

export const parseSchema = (
  input: unknown,
  plugins: QuestionPluginRegistry,
): Result<FlowSchema, readonly ParseProblem[]> => {
  // Migrate persisted question definitions to the installed plugin versions
  // before validation, so a compatible version bump does not invalidate saved
  // questionnaires. Incompatible versions are rejected here with a precise
  // message; the exact manifest check below stays as a final guard.
  const upcasted = upcastSchema(input, plugins);
  if (!upcasted.ok) return err(upcasted.error);
  const parsed = flowSchema(plugins).safeParse(upcasted.value);
  if (!parsed.success) return err(toParseProblems(parsed.error.issues));
  const schema = parsed.data as unknown as FlowSchema;
  if (schema.questionPlugins !== undefined) {
    const usedKinds = new Set(
      Object.values(schema.nodes).flatMap((node) =>
        node.kind === "page" ? node.questions.map(({ kind }) => kind) : [],
      ),
    );
    const mismatches = [...usedKinds].flatMap((kind) => {
      const installed = plugins.get(kind);
      const declared = schema.questionPlugins?.[kind];
      return installed !== undefined && declared === installed.version
        ? []
        : [
            {
              code: "invalid-wire-value" as const,
              path: ["questionPlugins", kind],
              details: {
                message: `Expected installed plugin version ${installed?.version ?? "missing"}, received ${declared ?? "missing"}`,
              },
            },
          ];
    });
    if (mismatches.length > 0) return err(mismatches);
  }
  return ok(schema);
};
