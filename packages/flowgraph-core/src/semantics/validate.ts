import type { Problem } from "../domain/problem";
import type { AnswerValue, FlowSchema, Question } from "../domain/schema";
import type { FlowState } from "../domain/state";
import type { QuestionId } from "../domain/ids";
import type {
  QuestionPluginProblem,
  QuestionPluginRegistry,
} from "../plugins/question-plugin";
import { findQuestion, isQuestionVisible, isTypedAnswer } from "./evaluate";
import { visibleQuestions } from "./visibility";

const problem = (code: Problem["code"], q: QuestionId): Problem => ({
  code,
  where: { q },
});

const pluginProblems = (
  question: Question,
  problems: readonly QuestionPluginProblem[],
): readonly Problem[] =>
  problems.map(({ code, where, details }) => ({
    code,
    where: { q: question.id, ...where },
    ...(details === undefined ? {} : { details }),
  }));

export const structuralAnswerProblems = (
  schema: FlowSchema,
  state: FlowState,
  questionId: QuestionId,
  value: AnswerValue,
  plugins: QuestionPluginRegistry,
): readonly Problem[] => {
  const location = findQuestion(schema, questionId);
  if (!location) return [problem("unknown-question", questionId)];
  if (
    state.trail.at(-1) !== location.page ||
    !isQuestionVisible(schema, state, questionId, plugins)
  ) {
    return [problem("not-current-page", questionId)];
  }
  if (!isTypedAnswer(plugins, location.question, value)) {
    return [problem("answer-kind-mismatch", questionId)];
  }
  const question = location.question;
  const plugin = plugins.get(question.kind);
  return plugin === undefined
    ? [problem("answer-kind-mismatch", questionId)]
    : pluginProblems(
        question,
        plugin.validateAnswer(question, value, "answer"),
      );
};

export const questionProblems = (
  schema: FlowSchema,
  state: FlowState,
  questionId: QuestionId,
  plugins: QuestionPluginRegistry,
): readonly Problem[] => {
  const location = findQuestion(schema, questionId);
  if (!location || !isQuestionVisible(schema, state, questionId, plugins))
    return [];
  const { question } = location;
  const value = state.answers[questionId];
  const plugin = plugins.get(question.kind);
  if (plugin === undefined)
    return [problem("answer-kind-mismatch", questionId)];
  const required =
    question.required === true && !plugin.isAnswered(question, value)
      ? [problem("required", questionId)]
      : [];
  if (value === undefined || !isTypedAnswer(plugins, question, value))
    return required;
  return [
    ...required,
    ...pluginProblems(
      question,
      plugin.validateAnswer(question, value, "submit"),
    ),
  ];
};

export const currentPageProblems = (
  schema: FlowSchema,
  state: FlowState,
  plugins: QuestionPluginRegistry,
): readonly Problem[] =>
  visibleQuestions(schema, state, plugins).flatMap((question) =>
    questionProblems(schema, state, question.id, plugins),
  );
