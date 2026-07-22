import { z } from "zod";

import { normalizeSafeInt } from "../domain/ids";
import type { ParseProblem } from "../domain/problem";

export const nonEmptyStringSchema = z.string().min(1);

export const safeIntSchema = z
  .number()
  .refine(Number.isSafeInteger)
  .transform(normalizeSafeInt);

export const nonNegativeSafeIntSchema = safeIntSchema.refine(
  (value) => value >= 0,
);

export const schemaHashSchema = z.string().regex(/^[0-9a-f]{64}$/u);

export const textRefSchema = z.strictObject({
  key: nonEmptyStringSchema,
  fallback: nonEmptyStringSchema,
});

export const pathSegmentSchema = z.strictObject({
  flow: nonEmptyStringSchema,
  instance: nonEmptyStringSchema.optional(),
});

export const commandMetaSchema = z.strictObject({
  at: nonNegativeSafeIntSchema,
  source: z.enum(["human", "agent", "import"]),
  path: z.array(pathSegmentSchema).length(0),
});

export const answerValueSchema: z.ZodType = z.lazy(() =>
  z.union([
    z.string(),
    z
      .number()
      .finite()
      .transform((value) => (Object.is(value, -0) ? 0 : value)),
    z.boolean(),
    z.null(),
    z.array(answerValueSchema),
    z.record(z.string(), answerValueSchema),
  ]),
);

export const toParseProblems = (
  issues: readonly z.core.$ZodIssue[],
): readonly ParseProblem[] =>
  issues.map((issue) => ({
    code: "invalid-wire-value",
    path: issue.path.map((part) =>
      typeof part === "number" ? part : String(part),
    ),
    details: { message: issue.message },
  }));
