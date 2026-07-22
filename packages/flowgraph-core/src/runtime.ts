import type { Command } from "./domain/command";
import type { Event } from "./domain/event";
import type { QuestionId } from "./domain/ids";
import type { FlowComposition, FlowPack } from "./domain/pack";
import type {
  AnswerValue,
  FlowSchema,
  Guard,
  NumericExpr,
  Question,
} from "./domain/schema";
import type { FlowState } from "./domain/state";
import { check } from "./authoring/check";
import { checkPack, compileComposition } from "./authoring/compose";
import { runGoldens } from "./authoring/golden";
import { probe } from "./authoring/probe";
import { decide } from "./engine/decide";
import { replay } from "./engine/replay";
import { parseComposition, parsePack } from "./parsing/pack";
import { parseSchema } from "./parsing/schema";
import type { QuestionPluginRegistry } from "./plugins/question-plugin";
import { activeAnswers } from "./semantics/active-truth";
import {
  evaluateGuard,
  evaluateNumeric,
  isQuestionVisible,
} from "./semantics/evaluate";
import {
  currentPageProblems,
  questionProblems,
  structuralAnswerProblems,
} from "./semantics/validate";
import { visibleQuestions } from "./semantics/visibility";

export type FlowGraphRuntime = {
  readonly questionPlugins: QuestionPluginRegistry;
  readonly questionPluginManifest: Readonly<Record<string, string>>;
  readonly parseSchema: (input: unknown) => ReturnType<typeof parseSchema>;
  readonly parsePack: (input: unknown) => ReturnType<typeof parsePack>;
  readonly parseComposition: (
    input: unknown,
  ) => ReturnType<typeof parseComposition>;
  readonly check: (schema: FlowSchema) => ReturnType<typeof check>;
  readonly checkPack: (pack: FlowPack) => ReturnType<typeof checkPack>;
  readonly compileComposition: (
    composition: FlowComposition,
  ) => ReturnType<typeof compileComposition>;
  readonly probe: (schema: FlowSchema) => ReturnType<typeof probe>;
  readonly runGoldens: (
    schema: FlowSchema,
    input: Parameters<typeof runGoldens>[1],
  ) => ReturnType<typeof runGoldens>;
  readonly decide: (
    schema: FlowSchema,
    state: FlowState,
    command: Command,
  ) => ReturnType<typeof decide>;
  readonly replay: (
    schema: FlowSchema,
    events: readonly Event[],
  ) => ReturnType<typeof replay>;
  readonly evaluateGuard: (
    schema: FlowSchema,
    state: FlowState,
    guard: Guard,
  ) => ReturnType<typeof evaluateGuard>;
  readonly evaluateNumeric: (
    schema: FlowSchema,
    state: FlowState,
    expression: NumericExpr,
  ) => ReturnType<typeof evaluateNumeric>;
  readonly isQuestionVisible: (
    schema: FlowSchema,
    state: FlowState,
    question: QuestionId,
  ) => boolean;
  readonly visibleQuestions: (
    schema: FlowSchema,
    state: FlowState,
  ) => readonly Question[];
  readonly activeAnswers: (
    schema: FlowSchema,
    state: FlowState,
  ) => Readonly<Record<QuestionId, AnswerValue>>;
  readonly structuralAnswerProblems: (
    schema: FlowSchema,
    state: FlowState,
    question: QuestionId,
    value: AnswerValue,
  ) => ReturnType<typeof structuralAnswerProblems>;
  readonly questionProblems: (
    schema: FlowSchema,
    state: FlowState,
    question: QuestionId,
  ) => ReturnType<typeof questionProblems>;
  readonly currentPageProblems: (
    schema: FlowSchema,
    state: FlowState,
  ) => ReturnType<typeof currentPageProblems>;
  readonly withQuestionPluginManifest: (schema: FlowSchema) => FlowSchema;
};

export const createFlowGraphRuntime = (
  questionPlugins: QuestionPluginRegistry,
): FlowGraphRuntime => {
  const questionPluginManifest = Object.freeze(
    Object.fromEntries(
      questionPlugins.list().map(({ kind, version }) => [kind, version]),
    ),
  );

  return Object.freeze({
    questionPlugins,
    questionPluginManifest,
    parseSchema: (input: unknown) => parseSchema(input, questionPlugins),
    parsePack: (input: unknown) => parsePack(input, questionPlugins),
    parseComposition: (input: unknown) =>
      parseComposition(input, questionPlugins),
    check: (schema: FlowSchema) => check(schema, questionPlugins),
    checkPack: (pack: FlowPack) => checkPack(pack, questionPlugins),
    compileComposition: (composition: FlowComposition) =>
      compileComposition(composition, questionPlugins),
    probe: (schema: FlowSchema) => probe(schema, questionPlugins),
    runGoldens: (schema: FlowSchema, input: Parameters<typeof runGoldens>[1]) =>
      runGoldens(schema, input, questionPlugins),
    decide: (schema: FlowSchema, state: FlowState, command: Command) =>
      decide(schema, state, command, questionPlugins),
    replay: (schema: FlowSchema, events: readonly Event[]) =>
      replay(schema, events, questionPlugins),
    evaluateGuard: (schema: FlowSchema, state: FlowState, guard: Guard) =>
      evaluateGuard(schema, state, guard, questionPlugins),
    evaluateNumeric: (
      schema: FlowSchema,
      state: FlowState,
      expression: NumericExpr,
    ) => evaluateNumeric(schema, state, expression, questionPlugins),
    isQuestionVisible: (
      schema: FlowSchema,
      state: FlowState,
      question: QuestionId,
    ) => isQuestionVisible(schema, state, question, questionPlugins),
    visibleQuestions: (schema: FlowSchema, state: FlowState) =>
      visibleQuestions(schema, state, questionPlugins),
    activeAnswers: (schema: FlowSchema, state: FlowState) =>
      activeAnswers(schema, state, questionPlugins),
    structuralAnswerProblems: (
      schema: FlowSchema,
      state: FlowState,
      question: QuestionId,
      value: AnswerValue,
    ) =>
      structuralAnswerProblems(schema, state, question, value, questionPlugins),
    questionProblems: (
      schema: FlowSchema,
      state: FlowState,
      question: QuestionId,
    ) => questionProblems(schema, state, question, questionPlugins),
    currentPageProblems: (schema: FlowSchema, state: FlowState) =>
      currentPageProblems(schema, state, questionPlugins),
    withQuestionPluginManifest: (schema: FlowSchema): FlowSchema => ({
      ...schema,
      questionPlugins: questionPluginManifest,
    }),
  });
};
