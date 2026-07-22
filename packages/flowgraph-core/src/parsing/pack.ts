import { z } from "zod";

import type { FlowComposition, FlowPack } from "../domain/pack";
import type { ParseProblem } from "../domain/problem";
import { err, ok, type Result } from "../domain/result";
import type { QuestionPluginRegistry } from "../plugins/question-plugin";
import { guardWireSchema, nodeWireSchema } from "./schema";
import { nonEmptyStringSchema, toParseProblems } from "./shared";

const entryWireSchema = z.strictObject({
  id: nonEmptyStringSchema,
  node: nonEmptyStringSchema,
});

const outletWireSchema = z.strictObject({
  id: nonEmptyStringSchema,
  from: nonEmptyStringSchema,
  when: guardWireSchema,
  required: z.boolean().optional(),
});

export const packWireSchema = (plugins: QuestionPluginRegistry) =>
  z.strictObject({
    id: nonEmptyStringSchema,
    version: nonEmptyStringSchema,
    entry: nonEmptyStringSchema,
    entries: z.array(entryWireSchema),
    nodes: z.record(nonEmptyStringSchema, nodeWireSchema(plugins)),
    outlets: z.array(outletWireSchema),
  });

const targetWireSchema = z.strictObject({
  instance: nonEmptyStringSchema,
  entry: nonEmptyStringSchema,
});

const connectionWireSchema = z.strictObject({
  from: z.strictObject({
    instance: nonEmptyStringSchema,
    outlet: nonEmptyStringSchema,
  }),
  to: targetWireSchema,
});

const compositionWireSchema = (plugins: QuestionPluginRegistry) =>
  z.strictObject({
    id: nonEmptyStringSchema,
    version: nonEmptyStringSchema,
    entry: targetWireSchema,
    instances: z.array(
      z.strictObject({
        id: nonEmptyStringSchema,
        pack: packWireSchema(plugins),
      }),
    ),
    connections: z.array(connectionWireSchema),
  });

const parsed = <Value>(
  result: z.ZodSafeParseResult<unknown>,
): Result<Value, readonly ParseProblem[]> =>
  result.success
    ? ok(result.data as Value)
    : err(toParseProblems(result.error.issues));

export const parsePack = (
  input: unknown,
  plugins: QuestionPluginRegistry,
): Result<FlowPack, readonly ParseProblem[]> =>
  parsed(packWireSchema(plugins).safeParse(input));

export const parseComposition = (
  input: unknown,
  plugins: QuestionPluginRegistry,
): Result<FlowComposition, readonly ParseProblem[]> =>
  parsed(compositionWireSchema(plugins).safeParse(input));
