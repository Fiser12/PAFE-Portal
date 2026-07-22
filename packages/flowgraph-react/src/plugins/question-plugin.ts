import type {
  QuestionPlugin,
  QuestionPluginProblem,
  QuestionPluginQuestion,
  FlowGraphRuntime,
  JsonValue,
  TextRef,
} from "flowgraph-core";
import type { ComponentType } from "react";

import type { AnswerResult, QuestionRenderer } from "../types";

export type QuestionPluginResolveText = (text: TextRef) => string | undefined;

export type QuestionPluginRendererProps<
  Q extends QuestionPluginQuestion,
  A extends JsonValue,
> = {
  readonly question: Q;
  readonly value: A | undefined;
  readonly problems: readonly QuestionPluginProblem[];
  readonly disabled: boolean;
  readonly resolveText: QuestionPluginResolveText;
  readonly onAnswer: (answer: A) => AnswerResult;
};

export type QuestionPluginEditorProps<Q extends QuestionPluginQuestion> = {
  readonly question: Q;
  readonly problems: readonly QuestionPluginProblem[];
  readonly disabled: boolean;
  readonly resolveText: QuestionPluginResolveText;
  readonly onChange: (question: Q) => void;
};

/**
 * React adapter exported by a question package alongside its core plugin.
 * Keeping it separate prevents flowgraph-core from acquiring a React runtime
 * dependency when schemas are parsed in Payload, workers or command-line tools.
 */
export type ReactQuestionPlugin<
  Q extends QuestionPluginQuestion = QuestionPluginQuestion,
  A extends JsonValue = JsonValue,
> = {
  readonly core: QuestionPlugin<Q, A>;
  readonly label: string;
  readonly QuestionRenderer: QuestionRenderer<Q>;
  readonly QuestionEditor: ComponentType<QuestionPluginEditorProps<Q>>;
};

export type AnyReactQuestionPlugin = ReactQuestionPlugin<any, any>;

export type ReactQuestionPluginRegistry = {
  readonly runtime: FlowGraphRuntime;
  readonly get: (kind: string) => AnyReactQuestionPlugin | undefined;
  readonly list: () => readonly AnyReactQuestionPlugin[];
};

export const createReactQuestionPluginRegistry = (
  runtime: FlowGraphRuntime,
  plugins: readonly AnyReactQuestionPlugin[],
): ReactQuestionPluginRegistry => {
  const byKind = new Map<string, AnyReactQuestionPlugin>();
  for (const plugin of plugins) {
    const installed = runtime.questionPlugins.get(plugin.core.kind);
    if (installed === undefined || installed.version !== plugin.core.version) {
      throw new Error(
        `React question plugin does not match runtime: ${plugin.core.kind}`,
      );
    }
    if (byKind.has(plugin.core.kind)) {
      throw new Error(`Duplicate React question plugin: ${plugin.core.kind}`);
    }
    byKind.set(plugin.core.kind, plugin);
  }
  const runtimeKinds = runtime.questionPlugins.list().map(({ kind }) => kind);
  const missing = runtimeKinds.find((kind) => !byKind.has(kind));
  if (missing !== undefined)
    throw new Error(`Missing React question plugin: ${missing}`);
  const registered = Object.freeze([...byKind.values()]);
  return Object.freeze({
    runtime,
    get: (kind: string) => byKind.get(kind),
    list: () => registered,
  });
};
