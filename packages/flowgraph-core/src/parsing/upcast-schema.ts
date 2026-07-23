import type { ParseProblem } from "../domain/problem";
import { err, ok, type Result } from "../domain/result";
import type {
  AnyQuestionPlugin,
  QuestionPluginRegistry,
} from "../plugins/question-plugin";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const majorOf = (version: string): number | undefined => {
  const match = /^(\d+)(?:\.\d+){0,2}$/.exec(version.trim());
  return match ? Number(match[1]) : undefined;
};

/**
 * Compatibility outcome for a persisted question definition of `declared`
 * version against the plugin's installed `version`:
 * - exact match or a backward-compatible same-major bump keeps the raw
 *   definition (the current schema validates it afterwards);
 * - an upcaster chain migrates it up to the installed version;
 * - anything else is incompatible.
 */
const migrateQuestion = (
  plugin: AnyQuestionPlugin,
  question: Record<string, unknown>,
  declared: string,
): Result<Record<string, unknown>, "incompatible"> => {
  const installed = plugin.version;
  if (declared === installed) return ok(question);

  const steps = plugin.upcasters ?? [];
  const byFrom = new Map(steps.map((step) => [step.from, step]));
  let current: Record<string, unknown> = question;
  let version = declared;
  for (let guard = 0; guard <= steps.length; guard += 1) {
    const step = byFrom.get(version);
    if (!step) break;
    current = { ...step.upcast(current) };
    version = step.to;
    if (version === installed) return ok(current);
  }

  // No chain reached the installed version. Accept a same-major bump as
  // backward-compatible (additive/minor changes keep the persisted shape);
  // the current schema still gets the final say during validation.
  const declaredMajor = majorOf(declared);
  const installedMajor = majorOf(installed);
  if (
    declaredMajor !== undefined &&
    installedMajor !== undefined &&
    declaredMajor === installedMajor
  ) {
    return ok(question);
  }
  return err("incompatible");
};

/**
 * Framework-owned, deterministic pre-pass that migrates persisted question
 * definitions to the installed plugin versions before schema validation.
 *
 * It only acts when the schema carries a `questionPlugins` manifest (every
 * questionnaire persisted through the host writes one). Questions whose
 * declared version differs from the installed one are migrated in place and
 * the manifest is rewritten to the installed versions, so the existing exact
 * manifest check downstream becomes a tautology for compatible schemas and
 * still rejects anything left unmigrated.
 */
export const upcastSchema = (
  input: unknown,
  plugins: QuestionPluginRegistry,
): Result<unknown, readonly ParseProblem[]> => {
  if (!isRecord(input) || !isRecord(input.questionPlugins)) return ok(input);
  const manifest = input.questionPlugins as Record<string, unknown>;
  if (!isRecord(input.nodes)) return ok(input);

  const problems: ParseProblem[] = [];
  const migratedManifest: Record<string, unknown> = { ...manifest };
  const nodes = input.nodes as Record<string, unknown>;
  const nextNodes: Record<string, unknown> = {};

  for (const [nodeId, node] of Object.entries(nodes)) {
    if (!isRecord(node) || node.kind !== "page" || !Array.isArray(node.questions)) {
      nextNodes[nodeId] = node;
      continue;
    }
    const questions = node.questions.map((question) => {
      if (!isRecord(question) || typeof question.kind !== "string") return question;
      const plugin = plugins.get(question.kind);
      const declared = manifest[question.kind];
      // Leave unknown kinds or unmanifested versions for the downstream
      // validation and exact-manifest check to reject with their own message.
      if (plugin === undefined || typeof declared !== "string") return question;
      const migrated = migrateQuestion(plugin, question, declared);
      if (!migrated.ok) {
        problems.push({
          code: "invalid-wire-value",
          path: ["nodes", nodeId, "questions"],
          details: {
            message: `Question plugin "${question.kind}" persisted as ${declared} cannot be migrated to installed ${plugin.version}`,
          },
        });
        return question;
      }
      migratedManifest[question.kind] = plugin.version;
      return migrated.value;
    });
    nextNodes[nodeId] = { ...node, questions };
  }

  if (problems.length > 0) return err(problems);
  return ok({ ...input, questionPlugins: migratedManifest, nodes: nextNodes });
};
