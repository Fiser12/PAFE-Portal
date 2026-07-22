import retailJson from "./schema.json" with { type: "json" };

import { parseSchema, type FlowSchema } from "../../support/runtime.js";

const parsed = parseSchema(retailJson);
if (!parsed.ok) throw new Error("Invalid governed retail fixture");

export const retailSchema: FlowSchema = parsed.value;
