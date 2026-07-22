import {
  canGoBack,
  currentNode,
  isFinished,
  outcome,
  progress,
  storedAnswer,
  type FlowGraphRuntime,
  type FlowSchema,
  type FlowState,
} from "flowgraph-core";
import type { FlowSession } from "flowgraph-session";
import { useMemo } from "react";

import type { FlowView } from "../types";
import { useFlowState } from "./use-flow-state";

export const deriveFlowView = (
  runtime: FlowGraphRuntime,
  schema: FlowSchema,
  state: FlowState,
): FlowView => ({
  status: state.status,
  current: currentNode(schema, state),
  questions: runtime.visibleQuestions(schema, state).map((question, order) => ({
    question,
    value: storedAnswer(state, question.id),
    order,
  })),
  progress: progress(schema, state),
  canGoBack: canGoBack(state),
  finished: isFinished(state),
  outcome: outcome(state),
  activeAnswers: runtime.activeAnswers(schema, state),
});

export const useFlowView = (
  runtime: FlowGraphRuntime,
  schema: FlowSchema,
  session: FlowSession,
): FlowView => {
  const state = useFlowState(session);
  return useMemo(
    () => deriveFlowView(runtime, schema, state),
    [runtime, schema, state],
  );
};
