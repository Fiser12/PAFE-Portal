import type {
  NodeId,
  OptionId,
  OutcomeId,
  QuestionId,
  SafeInt,
  SchemaId,
  SchemaVersion,
  TextRef,
} from "./ids";

export type FlowSchema = {
  readonly id: SchemaId;
  readonly version: SchemaVersion;
  readonly questionPlugins?: Readonly<Record<string, string>>;
  readonly entry: NodeId;
  readonly nodes: Readonly<Record<NodeId, Node>>;
};

export type Node = PageNode | TerminalNode;

export type PageNode = {
  readonly kind: "page";
  readonly title?: TextRef;
  readonly questions: readonly Question[];
  readonly edges: readonly Edge[];
};

export type TerminalNode = {
  readonly kind: "terminal";
  readonly outcome: OutcomeId;
};

export type Edge = {
  readonly to: NodeId;
  readonly when: Guard;
};

export type QuestionBase = {
  readonly id: QuestionId;
  readonly text: TextRef;
  readonly required?: boolean;
  readonly visibleWhen?: Guard;
};

export type QuestionDefinition = QuestionBase & {
  readonly kind: string;
};

/** Question packages augment this interface with their concrete definition. */
export interface QuestionTypeMap {}

export type Question = keyof QuestionTypeMap extends never
  ? QuestionDefinition
  : QuestionTypeMap[keyof QuestionTypeMap];

export type QuestionOption = {
  readonly id: OptionId;
  readonly text: TextRef;
  readonly weight?: SafeInt;
};

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  JsonPrimitive | readonly JsonValue[] | { readonly [key: string]: JsonValue };

/** Question packages augment this interface with their answer type. */
export interface QuestionAnswerTypeMap {}

export type AnswerValue = keyof QuestionAnswerTypeMap extends never
  ? JsonValue
  : QuestionAnswerTypeMap[keyof QuestionAnswerTypeMap] & JsonValue;

export type Truth = "true" | "false" | "unknown";

export type Guard =
  | { readonly kind: "always" }
  | { readonly kind: "answered"; readonly q: QuestionId }
  | {
      readonly kind: "selected";
      readonly q: QuestionId;
      readonly option: OptionId;
    }
  | { readonly kind: "not"; readonly value: Guard }
  | { readonly kind: "all"; readonly values: readonly Guard[] }
  | { readonly kind: "any"; readonly values: readonly Guard[] }
  | {
      readonly kind: "cmp";
      readonly op: ComparisonOperator;
      readonly left: NumericExpr;
      readonly right: NumericExpr;
    };

export type ComparisonOperator = "eq" | "ne" | "lt" | "lte" | "gt" | "gte";

export type NumericExpr =
  | { readonly kind: "num"; readonly value: SafeInt }
  | { readonly kind: "answer"; readonly q: QuestionId }
  | { readonly kind: "score"; readonly q: QuestionId }
  | { readonly kind: "sum"; readonly values: readonly NumericExpr[] };

export type NumericResult =
  | { readonly kind: "known"; readonly value: SafeInt }
  | { readonly kind: "unknown" };
