import { toSchemaHash, type SchemaHash } from "../domain/ids";
import type { FlowSchema } from "../domain/schema";
import { canonicalizeSchema } from "./canonical-json";
import { sha256 } from "./sha256";
import { utf8Encode } from "./utf8";

export const hashSchema = (schema: FlowSchema): SchemaHash =>
  toSchemaHash(sha256(utf8Encode(canonicalizeSchema(schema))));
