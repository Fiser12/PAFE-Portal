import type { OptionId, QuestionId, SafeInt, TextRef } from "../domain/ids";
import type { SchemaProblem } from "../domain/problem";
import type {
  ComparisonOperator,
  Guard,
  JsonValue,
  QuestionDefinition,
} from "../domain/schema";

/**
 * Minimum shape understood by FlowGraph for every question kind.
 *
 * Concrete question packages extend this type with their own serializable
 * configuration. The `kind` value is the stable key used by the plugin
 * registry and persisted schemas.
 */
export type QuestionPluginQuestion = QuestionDefinition;

export type QuestionPluginCreateContext = {
  readonly id: QuestionId;
  readonly text: TextRef;
};

export type QuestionPluginProblem = {
  readonly code: string;
  readonly where?: Readonly<Record<string, string | number>>;
  readonly details?: Readonly<Record<string, unknown>>;
};

export type QuestionPluginOption = {
  readonly id: OptionId;
  readonly text: TextRef;
};

/** Declarative conditions the graph editor may offer for a question. */
export type QuestionConditionCapability =
  | { readonly kind: "answered" }
  | {
      readonly kind: "selected";
      readonly options: readonly QuestionPluginOption[];
    }
  | {
      readonly kind: "compare";
      readonly source: "answer" | "score";
      readonly operators: readonly ComparisonOperator[];
    };

export type QuestionPluginAnswerPhase = "answer" | "submit";

export type QuestionPluginSchemaIssue = {
  readonly message: string;
  readonly path: readonly PropertyKey[];
};

/** Minimal validation contract; Zod implements it, but plugins are not forced to use Zod. */
export type QuestionPluginSchema<T> = {
  readonly safeParse: (input: unknown) =>
    | { readonly success: true; readonly data: T }
    | {
        readonly success: false;
        readonly error: {
          readonly issues: readonly QuestionPluginSchemaIssue[];
        };
      };
};

export type QuestionPluginProbeContext = {
  readonly numericThresholds: readonly number[];
};

export type QuestionPluginNamespaceContext = {
  readonly questionId: (id: QuestionId) => QuestionId;
  readonly optionId: (id: OptionId) => OptionId;
};

/**
 * A pure, framework-orchestrated migration step for a persisted question
 * definition. It transforms the raw stored object of version `from` into the
 * shape of version `to`. It must be deterministic and perform no storage,
 * network, or UI work, and must preserve fields it does not intend to change.
 */
export type QuestionUpcaster = {
  readonly from: string;
  readonly to: string;
  readonly upcast: (
    question: Readonly<Record<string, unknown>>,
  ) => Readonly<Record<string, unknown>>;
};

/**
 * Framework-neutral contract implemented by a question package.
 *
 * Navigation and guard evaluation remain owned by FlowGraph. A plugin only
 * exposes the data and deterministic semantics needed by those systems.
 */
export type QuestionPlugin<
  Q extends QuestionPluginQuestion = QuestionPluginQuestion,
  A extends JsonValue = JsonValue,
> = {
  readonly kind: Q["kind"];
  readonly version: string;
  /**
   * Ordered pure migration steps from older persisted versions up to
   * `version`. Framework code chains them; a plugin never runs them itself.
   */
  readonly upcasters?: readonly QuestionUpcaster[];
  readonly questionSchema: QuestionPluginSchema<Q>;
  readonly answerSchema: QuestionPluginSchema<A>;
  readonly createDefault: (context: QuestionPluginCreateContext) => Q;
  readonly isAnswered: (question: Q, answer: A | undefined) => boolean;
  readonly validateAnswer: (
    question: Q,
    answer: A,
    phase: QuestionPluginAnswerPhase,
  ) => readonly QuestionPluginProblem[];
  readonly validateQuestion?: (question: Q) => readonly SchemaProblem[];
  readonly conditions: (question: Q) => readonly QuestionConditionCapability[];
  readonly numericValue?: (question: Q, answer: A) => SafeInt | undefined;
  readonly score?: (question: Q, answer: A) => SafeInt | undefined;
  readonly isSelected?: (question: Q, answer: A, option: OptionId) => boolean;
  readonly probeValues?: (
    question: Q,
    context: QuestionPluginProbeContext,
  ) => readonly A[];
  readonly namespace?: (
    question: Q,
    context: QuestionPluginNamespaceContext,
  ) => Q;
};

// A heterogeneous registry necessarily erases each plugin's Q/A pair. The
// public helpers preserve the concrete types before registration.
export type AnyQuestionPlugin = QuestionPlugin<any, any>;

export type QuestionPluginRegistry = {
  readonly get: (kind: string) => AnyQuestionPlugin | undefined;
  readonly has: (kind: string) => boolean;
  readonly list: () => readonly AnyQuestionPlugin[];
};

export type QuestionPluginRegistryProblemCode =
  "invalid-plugin-kind" | "invalid-plugin-version" | "duplicate-plugin-kind";

export class QuestionPluginRegistryError extends Error {
  readonly code: QuestionPluginRegistryProblemCode;
  readonly kind: string;

  constructor(code: QuestionPluginRegistryProblemCode, kind: string) {
    super(`${code}: ${kind}`);
    this.name = "QuestionPluginRegistryError";
    this.code = code;
    this.kind = kind;
  }
}

export const createQuestionPluginRegistry = (
  plugins: readonly AnyQuestionPlugin[],
): QuestionPluginRegistry => {
  const byKind = new Map<string, AnyQuestionPlugin>();

  for (const plugin of plugins) {
    const kind = plugin.kind.trim();
    if (kind.length === 0 || kind !== plugin.kind) {
      throw new QuestionPluginRegistryError("invalid-plugin-kind", plugin.kind);
    }
    if (plugin.version.trim().length === 0) {
      throw new QuestionPluginRegistryError(
        "invalid-plugin-version",
        plugin.kind,
      );
    }
    if (byKind.has(kind)) {
      throw new QuestionPluginRegistryError("duplicate-plugin-kind", kind);
    }
    byKind.set(kind, plugin);
  }

  const registered = Object.freeze([...byKind.values()]);

  return Object.freeze({
    get: (kind: string) => byKind.get(kind),
    has: (kind: string) => byKind.has(kind),
    list: () => registered,
  });
};

/** A guard remains engine-owned even when its operands come from a plugin. */
export type QuestionPluginGuard = Guard;
