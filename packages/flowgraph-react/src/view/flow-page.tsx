import type { Problem } from "flowgraph-core";
import { useEffect, useRef, type ReactNode } from "react";
import {
  DraftRegistryContext,
  QuestionOrderContext,
  draftRegistryOf,
} from "../controller/internal";
import { resolveQuestionRenderer } from "../renderers/renderer-registry";
import type { ReactQuestionPluginRegistry } from "../plugins/question-plugin";
import type {
  FlowSurveyController,
  RendererRegistry,
  ResolveText,
} from "../types";
import { problemQuestion, problemsForQuestion } from "./problem-mapping";
import { ProblemMessages } from "./problem-messages";
import { resolveText } from "./resolve-text";

export type FlowPageProps = {
  readonly controller: FlowSurveyController;
  readonly resolveText?: ResolveText;
  readonly renderers?: RendererRegistry;
  readonly questionPlugins: ReactQuestionPluginRegistry;
  readonly disabled?: boolean;
  readonly backLabel?: string;
  readonly nextLabel?: string;
  readonly beforeQuestions?: ReactNode;
};

export const FlowPage = ({
  controller,
  resolveText: resolver,
  renderers,
  questionPlugins,
  disabled = false,
  backLabel = "Atrás",
  nextLabel = "Continuar",
  beforeQuestions,
}: FlowPageProps) => {
  const { view, friction } = controller;
  const drafts = draftRegistryOf(controller);
  const page = useRef<HTMLElement>(null);
  const summary = useRef<HTMLDivElement>(null);
  const focusedFriction = useRef(friction);
  const pageProblems = friction.problems.filter(
    (problem: Problem) => problemQuestion(problem) === undefined,
  );

  useEffect(() => {
    if (
      friction === focusedFriction.current ||
      friction.problems.length === 0 ||
      (friction.action !== "next" && friction.action !== "back")
    ) {
      return;
    }
    focusedFriction.current = friction;
    const firstQuestion = friction.problems
      .map(problemQuestion)
      .find((question) => question !== undefined);
    const draftFocused = drafts.focusFirst(friction.problems);
    const pageElement = page.current as HTMLElement;
    const questionGroup = [
      ...pageElement.querySelectorAll("[data-flowgraph-question]"),
    ].find(
      (element) =>
        element.getAttribute("data-flowgraph-question") === firstQuestion,
    );
    const field = questionGroup?.querySelector<HTMLElement>(
      "input, textarea, select, button",
    );
    if (field !== undefined && field !== null) field.focus();
    else if (!draftFocused) summary.current?.focus();
  }, [drafts, friction]);

  if (view.status !== "active" || view.current.kind !== "page") return null;

  return (
    <DraftRegistryContext.Provider value={drafts}>
      <section ref={page} aria-labelledby="flowgraph-page-title">
        <h2 id="flowgraph-page-title">
          {view.current.title
            ? resolveText(view.current.title, resolver)
            : "Encuesta"}
        </h2>
        <progress
          aria-label="Progreso"
          max={1}
          value={view.progress.fraction}
        />
        <ProblemMessages
          id="flowgraph-page-problems"
          problems={pageProblems}
          live
          focusRef={(element) => {
            summary.current = element;
          }}
        />
        {beforeQuestions}
        {view.questions.map(({ question, value, order }) => {
          const questionPlugin = questionPlugins.get(question.kind);
          const Renderer = resolveQuestionRenderer(
            question,
            questionPlugins,
            renderers,
          );
          const selectable = questionPlugin?.core
            .conditions(question)
            .find((capability) => capability.kind === "selected");
          const options =
            selectable?.kind === "selected"
              ? selectable.options.map((option) => ({
                  id: option.id,
                  text: resolveText(option.text, resolver),
                }))
              : undefined;
          return (
            <QuestionOrderContext.Provider key={question.id} value={order}>
              <Renderer
                question={question}
                text={resolveText(question.text, resolver)}
                {...(options === undefined ? {} : { options })}
                value={value}
                problems={problemsForQuestion(friction.problems, question.id)}
                disabled={disabled}
                onAnswer={(answer) => controller.answer(question.id, answer)}
              />
            </QuestionOrderContext.Provider>
          );
        })}
        <nav aria-label="Navegación de la encuesta">
          <button
            type="button"
            disabled={disabled || !view.canGoBack}
            onClick={controller.back}
          >
            {backLabel}
          </button>
          <button type="button" disabled={disabled} onClick={controller.next}>
            {nextLabel}
          </button>
        </nav>
      </section>
    </DraftRegistryContext.Provider>
  );
};
