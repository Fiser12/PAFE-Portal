import type {
  Command,
  Event,
  FlowState,
  Problem,
  Result,
} from "flowgraph-core";

export type StateListener = () => void;
export type EventListener = (batch: readonly Event[]) => void;
export type Unsubscribe = () => void;

export type SessionOptions = {
  /**
   * Invoked with listener failures after a dispatch has committed. When
   * omitted, the session throws one AggregateError instead; the commit is
   * never rolled back in either case.
   */
  readonly onListenerError?: (failures: readonly unknown[]) => void;
};

export type FlowSession = {
  readonly dispatch: (
    command: Command,
  ) => Result<readonly Event[], readonly Problem[]>;
  readonly getSnapshot: () => FlowState;
  readonly getEvents: () => readonly Event[];
  readonly subscribe: (listener: StateListener) => Unsubscribe;
  readonly subscribeEvents: (listener: EventListener) => Unsubscribe;
};
