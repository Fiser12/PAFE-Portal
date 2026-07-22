export type {
  NodeId,
  OptionId,
  OutcomeId,
  PackId,
  PackInstanceId,
  PackPortId,
  QuestionId,
  SafeInt,
  SchemaHash,
  SchemaId,
  SchemaVersion,
  TextRef,
} from "./domain/ids";
export {
  isSafeInt,
  normalizeSafeInt,
  toNodeId,
  toOptionId,
  toOutcomeId,
  toPackId,
  toPackInstanceId,
  toPackPortId,
  toQuestionId,
  toSafeInt,
  toSchemaHash,
  toSchemaId,
  toSchemaVersion,
} from "./domain/ids";
export type {
  Command,
  CommandMeta,
  PathSegment,
  Source,
} from "./domain/command";
export type { Event, EventEnvelope } from "./domain/event";
export type {
  GoldenProblem,
  ParseProblem,
  Problem,
  ProblemCode,
  SchemaProblem,
  SchemaProblemCode,
} from "./domain/problem";
export type { Result } from "./domain/result";
export { err, ok } from "./domain/result";
export type {
  CompositionProblem,
  CompositionProblemCode,
  FlowComposition,
  FlowPack,
  PackConnection,
  PackEntry,
  PackFactory,
  PackInstance,
  PackOutlet,
  PackProblem,
  PackProblemCode,
  PackTarget,
} from "./domain/pack";
export type {
  AnswerValue,
  ComparisonOperator,
  Edge,
  FlowSchema,
  Guard,
  Node,
  NumericExpr,
  NumericResult,
  JsonPrimitive,
  JsonValue,
  PageNode,
  Question,
  QuestionAnswerTypeMap,
  QuestionBase,
  QuestionDefinition,
  QuestionOption,
  QuestionTypeMap,
  TerminalNode,
  Truth,
} from "./domain/schema";
export type {
  AnyQuestionPlugin,
  QuestionConditionCapability,
  QuestionPlugin,
  QuestionPluginAnswerPhase,
  QuestionPluginCreateContext,
  QuestionPluginGuard,
  QuestionPluginNamespaceContext,
  QuestionPluginOption,
  QuestionPluginProblem,
  QuestionPluginProbeContext,
  QuestionPluginQuestion,
  QuestionPluginRegistry,
  QuestionPluginRegistryProblemCode,
  QuestionPluginSchema,
  QuestionPluginSchemaIssue,
} from "./plugins/question-plugin";
export {
  createQuestionPluginRegistry,
  QuestionPluginRegistryError,
} from "./plugins/question-plugin";
export type {
  EdgeCoverage,
  FlowState,
  GoldenCase,
  GoldenCaseReport,
  GoldenCommand,
  GoldenReport,
  GoldenSuiteV1,
  ProbePageReport,
  ProbeReport,
  ProbeWitness,
  Progress,
} from "./domain/state";
export { parseCommand, parseEvents } from "./parsing/event";
export {
  guardWireSchema,
  numericExprWireSchema,
  parseSchema,
} from "./parsing/schema";
export {
  nonEmptyStringSchema,
  safeIntSchema,
  textRefSchema,
} from "./parsing/shared";
export { parseComposition, parsePack } from "./parsing/pack";
export { upcastEvents } from "./parsing/upcast";
export { allTruth, anyTruth, notTruth } from "./semantics/truth";
export { evaluateGuard, evaluateNumeric } from "./semantics/evaluate";
export { activeAnswers, storedAnswer } from "./semantics/active-truth";
export {
  currentPageProblems,
  questionProblems,
  structuralAnswerProblems,
} from "./semantics/validate";
export { canonicalizeSchema } from "./integrity/canonical-json";
export { utf8Encode } from "./integrity/utf8";
export { sha256 } from "./integrity/sha256";
export { hashSchema } from "./integrity/schema-hash";
export { initialState } from "./engine/initial-state";
export { apply } from "./engine/apply";
export { decide } from "./engine/decide";
export { replay } from "./engine/replay";
export {
  canGoBack,
  currentNode,
  isFinished,
  outcome,
  visibleQuestions,
} from "./selectors/navigation";
export { progress } from "./selectors/progress";
export { check } from "./authoring/check";
export {
  checkPack,
  compileComposition,
  namespaceNodeId,
  namespaceOptionId,
  namespaceOutcomeId,
  namespaceQuestionId,
} from "./authoring/compose";
export { probe } from "./authoring/probe";
export { runGoldens } from "./authoring/golden";
export { createFlowGraphRuntime, type FlowGraphRuntime } from "./runtime";
