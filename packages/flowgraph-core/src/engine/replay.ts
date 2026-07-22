import type { Command, CommandMeta } from "../domain/command";
import type { Event } from "../domain/event";
import type { NodeId } from "../domain/ids";
import type { Problem } from "../domain/problem";
import { err, ok, type Result } from "../domain/result";
import type { FlowSchema, JsonValue } from "../domain/schema";
import type { FlowState } from "../domain/state";
import type { QuestionPluginRegistry } from "../plugins/question-plugin";
import { hashSchema } from "../integrity/schema-hash";
import { upcastEvents } from "../parsing/upcast";
import { apply } from "./apply";
import { decide } from "./decide";
import { initialState } from "./initial-state";

type ReplayEvent = Exclude<Event, { readonly kind: "SESSION_STARTED" }>;

const mismatch = (): Result<FlowState, Problem> =>
  err({ code: "log-schema-mismatch" });

const metadata = (event: Event): CommandMeta => ({
  at: event.at,
  source: event.source,
  path: event.path,
});

const samePath = (left: Event["path"], right: Event["path"]): boolean =>
  left.length === right.length;

const sameAnswer = (left: JsonValue, right: JsonValue): boolean => {
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => sameAnswer(value, right[index] as JsonValue))
    );
  }
  if (typeof left === "object" || typeof right === "object") {
    if (
      left === null ||
      right === null ||
      typeof left !== "object" ||
      typeof right !== "object"
    ) {
      return left === right;
    }
    const leftEntries = Object.entries(left);
    const rightEntries = Object.entries(right);
    const rightRecord = right as Readonly<Record<string, JsonValue>>;
    return (
      leftEntries.length === rightEntries.length &&
      leftEntries.every(
        ([key, value]) =>
          Object.hasOwn(rightRecord, key) &&
          sameAnswer(value, rightRecord[key] as JsonValue),
      )
    );
  }
  return left === right;
};

const sameEvent = (left: ReplayEvent, right: ReplayEvent): boolean => {
  if (
    left.kind !== right.kind ||
    left.at !== right.at ||
    left.source !== right.source ||
    !samePath(left.path, right.path)
  ) {
    return false;
  }
  switch (left.kind) {
    case "ANSWERED":
      return (
        right.kind === "ANSWERED" &&
        left.q === right.q &&
        sameAnswer(left.value, right.value)
      );
    case "ADVANCED":
      return (
        right.kind === "ADVANCED" &&
        left.from === right.from &&
        left.to === right.to
      );
    case "WENT_BACK":
      return (
        right.kind === "WENT_BACK" &&
        left.from === right.from &&
        left.to === right.to
      );
    case "SESSION_FINISHED":
      return (
        right.kind === "SESSION_FINISHED" && left.outcome === right.outcome
      );
  }
};

const expectedBatch = (
  schema: FlowSchema,
  state: FlowState,
  command: Command,
  plugins: QuestionPluginRegistry,
): readonly Event[] | undefined => {
  const result = decide(schema, state, command, plugins);
  return result.ok ? result.value : undefined;
};

export const replay = (
  schema: FlowSchema,
  input: readonly Event[],
  plugins: QuestionPluginRegistry,
): Result<FlowState, Problem> => {
  const upcasted = upcastEvents(input);
  if (!upcasted.ok) return err(upcasted.error);
  const events = upcasted.value;
  let state = initialState(schema);
  if (events.length === 0) return ok(state);

  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    if (!event || state.status === "finished") return mismatch();

    if (event.kind === "SESSION_STARTED") {
      if (
        index !== 0 ||
        event.schemaId !== schema.id ||
        event.schemaVersion !== schema.version ||
        event.schemaHash !== hashSchema(schema)
      ) {
        return index === 0 ? err({ code: "schema-mismatch" }) : mismatch();
      }
      state = apply(state, event);
      continue;
    }

    if (index === 0 || state.status === "not-started") return mismatch();

    if (event.kind === "ANSWERED") {
      const expected = expectedBatch(
        schema,
        state,
        {
          kind: "ANSWER",
          meta: metadata(event),
          q: event.q,
          value: event.value,
        },
        plugins,
      );
      if (
        expected?.length !== 1 ||
        !expected[0] ||
        !sameEvent(expected[0] as ReplayEvent, event)
      ) {
        return mismatch();
      }
      state = apply(state, event);
      continue;
    }

    if (event.kind === "WENT_BACK") {
      const expected = expectedBatch(
        schema,
        state,
        {
          kind: "BACK",
          meta: metadata(event),
        },
        plugins,
      );
      if (
        expected?.length !== 1 ||
        !expected[0] ||
        !sameEvent(expected[0] as ReplayEvent, event)
      ) {
        return mismatch();
      }
      state = apply(state, event);
      continue;
    }

    if (event.kind === "ADVANCED") {
      const expected = expectedBatch(
        schema,
        state,
        {
          kind: "NEXT",
          meta: metadata(event),
        },
        plugins,
      );
      if (!expected?.[0] || !sameEvent(expected[0] as ReplayEvent, event))
        return mismatch();
      if (expected.length === 2) {
        const expectedFinish = expected[1];
        const actualFinish = events[index + 1];
        if (
          !expectedFinish ||
          !actualFinish ||
          !sameEvent(expectedFinish as ReplayEvent, actualFinish as ReplayEvent)
        ) {
          return mismatch();
        }
      }
      state = apply(state, event);
      continue;
    }

    const previous = events[index - 1];
    const node = state.trail.at(-1) as NodeId;
    const terminal = schema.nodes[node];
    if (
      previous?.kind !== "ADVANCED" ||
      terminal?.kind !== "terminal" ||
      event.outcome !== terminal.outcome ||
      previous.at !== event.at ||
      previous.source !== event.source ||
      !samePath(previous.path, event.path)
    ) {
      return mismatch();
    }
    state = apply(state, event);
  }

  return ok(state);
};
