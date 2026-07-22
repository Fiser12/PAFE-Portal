import type { FlowSchema } from "../domain/schema";
import type { FlowState } from "../domain/state";

export const initialState = (schema: FlowSchema): FlowState => ({
  status: "not-started",
  schemaId: schema.id,
  schemaVersion: schema.version,
  trail: [schema.entry],
  answers: {},
});
