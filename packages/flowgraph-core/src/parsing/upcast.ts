import type { Event } from "../domain/event";
import type { Problem } from "../domain/problem";
import { err, ok, type Result } from "../domain/result";
import { parseEvents } from "./event";

const isRecord = (value: unknown): value is Readonly<Record<string, unknown>> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const upcastEvents = (
  input: readonly unknown[],
): Result<readonly Event[], Problem> => {
  if (
    input.some(
      (value) => isRecord(value) && value.v !== undefined && value.v !== 1,
    )
  ) {
    return err({ code: "unsupported-event-version" });
  }
  const parsed = parseEvents(input);
  return parsed.ok ? ok(parsed.value) : err({ code: "log-schema-mismatch" });
};
