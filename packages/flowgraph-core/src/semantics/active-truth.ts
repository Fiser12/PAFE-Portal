import type { QuestionId } from "../domain/ids";
import type { AnswerValue, FlowSchema } from "../domain/schema";
import type { FlowState } from "../domain/state";
import type { QuestionPluginRegistry } from "../plugins/question-plugin";
import { findQuestion, isQuestionVisible, isTypedAnswer } from "./evaluate";

export const storedAnswer = (
  state: FlowState,
  question: QuestionId,
): AnswerValue | undefined => state.answers[question];

export const activeAnswers = (
  schema: FlowSchema,
  state: FlowState,
  plugins: QuestionPluginRegistry,
): Readonly<Record<QuestionId, AnswerValue>> =>
  Object.fromEntries(
    Object.entries(state.answers).filter(([questionId, value]) => {
      const location = findQuestion(schema, questionId as QuestionId);
      return (
        location !== undefined &&
        state.trail.includes(location.page) &&
        isTypedAnswer(plugins, location.question, value) &&
        isQuestionVisible(schema, state, questionId as QuestionId, plugins)
      );
    }),
  );
