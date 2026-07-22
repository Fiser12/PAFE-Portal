import type { Question } from "flowgraph-core";

import type { ReactQuestionPluginRegistry } from "../plugins/question-plugin";
import type { QuestionRenderer, RendererRegistry } from "../types";

export const resolveQuestionRenderer = (
  question: Question,
  plugins: ReactQuestionPluginRegistry,
  registry?: RendererRegistry,
): QuestionRenderer => {
  const renderer =
    registry?.byId?.[question.id] ??
    registry?.byKind?.[question.kind] ??
    plugins.get(question.kind)?.QuestionRenderer;

  if (!renderer) {
    throw new Error(
      `No renderer configured for question "${question.id}" of kind "${question.kind}"`,
    );
  }
  return renderer;
};
