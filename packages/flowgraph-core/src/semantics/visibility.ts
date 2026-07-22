import type { FlowSchema, Question } from "../domain/schema";
import type { FlowState } from "../domain/state";
import type { QuestionPluginRegistry } from "../plugins/question-plugin";
import { isQuestionVisible } from "./evaluate";

export const visibleQuestions = (
  schema: FlowSchema,
  state: FlowState,
  plugins: QuestionPluginRegistry,
): readonly Question[] => {
  const current = state.trail.at(-1);
  const node = current ? schema.nodes[current] : undefined;
  return node?.kind === "page"
    ? node.questions.filter((question) =>
        isQuestionVisible(schema, state, question.id, plugins),
      )
    : [];
};
