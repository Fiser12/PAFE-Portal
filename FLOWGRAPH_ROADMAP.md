# FlowGraph roadmap

This roadmap records the product capabilities worth adopting from mature survey
builders such as SurveyJS without giving up FlowGraph's explicit acyclic graph,
deterministic runtime, event log, or package boundaries.

Resource authorization is deliberately specified outside FlowGraph. See
[`PAYLOAD_AUTHORIZATION_ARCHITECTURE.md`](./PAYLOAD_AUTHORIZATION_ARCHITECTURE.md)
for the native Payload CMS design and its optional evolution to SpiceDB.

## Foundations already in place

- Pure `flowgraph-core` runtime with parsing, structural checks, guard evaluation,
  replay, probing, journey generation, and schema hashing.
- Observable `flowgraph-session` shell and optional event-log persistence adapters.
- Framework-neutral `QuestionPlugin` contract plus separate text, number, and select
  question packages.
- React renderer/editor contract in `flowgraph-react`.
- PAFE visual graph editor for pages, terminal outcomes, connections, entry-page
  selection, and per-node question editing.
- Payload validation and persisted question-plugin manifest, schema id, version, and
  hash.

## P0 — complete the authoring and execution lifecycle

### Visual condition builder

- Expose all engine-owned guards in the graph editor: `all`, `any`, `not`, numeric
  comparisons, answer values, scores, and sums.
- Edit question `visibleWhen` rules from the question modal.
- Derive the operands and operators offered by the UI from each question plugin's
  declared condition capabilities; do not hardcode concrete question kinds in the
  graph editor.
- Keep edge priority and the single fallback route explicit, and reject invalid or
  cyclic graphs before saving.

### Executions, submissions, and resume

- Persist questionnaire executions separately from questionnaire definitions.
- Store the immutable event log, questionnaire id, schema hash/version, user,
  execution status, timestamps, and terminal outcome.
- Replay and validate events on the server before accepting a completed execution.
- Wire browser persistence into the PAFE runner, then support authenticated
  server-backed resume across devices.

### Declarative data loaders

- Allow a page to declare a loader by stable id and version. Persist only the loader
  reference and its bindings in the questionnaire JSON, never executable code or an
  arbitrary URL.
- Let the visual page editor bind each loader input to a previous answer, a fixed
  value, or an explicitly exposed host-context value.
- Require loaders to declare framework-neutral input and output schemas so the editor
  can build the bindings and validate them before saving.
- Register loader implementations statically in the host application or install them
  from trusted packages; keep network and storage access outside `flowgraph-core`.
- Make resolved resources available to question plugins, initially to populate dynamic
  select options and informational content.
- Record validated loader inputs, loader identity/version, and the resolved output in
  the execution event log. Replay must consume that captured result instead of
  repeating an external request whose response may have changed.
- Invalidate a resolved resource and dependent answers when a user goes back and
  changes an input answer. Reload using a stable dependency key and define explicit
  loading, empty, error, retry, and unavailable states.
- Validate whether answer bindings are guaranteed to exist before the page is reached;
  otherwise require the input to be optional and represent the missing value
  explicitly.
- Pass authenticated user/device/mission authorization context to loaders separately
  from author-controlled bindings, and enforce authorization again in the backing
  service.

### Draft preview

- Add a preview action to the visual editor that runs the current unsaved draft.
- Reuse the production runtime and question renderers so preview cannot develop
  different navigation or validation semantics.
- Include a convenient reset/restart action and responsive viewport presets.

### Plugin evolution policy

- Define compatibility rules for persisted question definitions when a plugin
  version changes.
- Keep schema upcasting framework-owned and deterministic; plugin packages may
  provide pure version steps, but must not perform storage, network, or UI work.
- Add compatibility fixtures before releasing a second persisted version of any
  question plugin.

## P1 — product completeness

### Validation

- Add localized problem messages and configurable validation timing.
- Define an application-level asynchronous/server validation boundary without
  introducing I/O into `flowgraph-core` or question semantics.
- Show authoring diagnostics next to the affected node, question, option, or edge.

### Localization

- Add locale-aware editing for page titles, question text, choices, validation
  messages, and terminal content.
- Resolve `TextRef` values through an injected catalog and retain `fallback` as the
  safe default.
- Allow previewing a draft in each configured locale.

### Question packages

- Add question packages only for demonstrated product needs. Likely next candidates
  are boolean/yes-no, date, rating, and informational content.
- Keep attachments out of scope until storage, authorization, antivirus scanning,
  retention, and submission ownership are designed together.
- Preserve the rule that a question package owns its schema, answer semantics,
  validation, condition capabilities, runtime renderer, and editor.

### Authoring usability and accessibility

- Add question reordering, duplication, undo/redo, and clearer connection editing.
- Improve large-graph navigation and diagnostics without bringing back a canvas-
  obscuring sidebar.
- Complete manual keyboard and screen-reader checks in addition to the automated
  WCAG 2.2 AA baseline.

## P2 — advanced capabilities, introduced only with a concrete use case

- Calculated values and controlled actions such as set/copy answer or conditional
  completion.
- Questionnaire-level theme tokens and a visual theme editor.
- Seeded, replayable randomization of questions or choices.
- Composite and repeating questions such as panels or matrices. These require a
  separate container/composition contract rather than stretching `QuestionPlugin`.
- Dynamic option sources. Network access belongs in a host data-source adapter; the
  general loader contract above should cover these before specialized remote-choice
  behavior is added.

### Sandboxed programmable transformations

- Offer an optional advanced authoring mode for pure transformations over a read-only,
  JSON-serializable snapshot of answers collected so far. Prefer explicit answer
  projections; access to the entire snapshot must be a privileged, audited choice.
- Accept a restricted TypeScript authoring syntax, but compile it at publish time into
  a versioned immutable artifact. The questionnaire stores only the approved artifact
  id, version, and hash.
- Never execute author code with `eval`, `Function`, `node:vm`, inside the browser page,
  or inside the Next/Payload process. Run it in disposable OS-level or WebAssembly-
  level isolation with no ambient authority.
- Deny imports and access to network, filesystem, DOM, process/environment, credentials,
  clock, randomness, threads, and host objects. Expose only a small immutable input and
  require a JSON output that passes a declared schema.
- Apply CPU, wall-clock, memory, output-size, and recursion limits; terminate and
  destroy the sandbox on timeout or policy violation.
- Keep scripts computational only: they may derive values or loader inputs, but cannot
  mutate answers, navigate, perform I/O, or hide graph transitions. The visual graph
  remains the authoritative representation of control flow.
- Invalidate script output whenever any declared input changes. If the whole answer
  snapshot is provided, conservatively treat every previous answer as a dependency.
- Record artifact hash, validated input, output, and failure state in the execution
  event log so replay never reruns untrusted code.
- Require role-based authoring permission, review/approval before publication, source
  history, static analysis, provenance, a kill switch, and security tests for sandbox
  escape and denial-of-service attempts.

## Architectural constraints

- The persisted flow remains an explicit acyclic graph; no implicit skip logic or
  runtime cycles.
- `flowgraph-core` remains synchronous, pure, framework-neutral, and free of I/O.
- The graph editor consumes plugin capabilities but does not own question-specific
  semantics.
- Questionnaire JSON may bind data to trusted loader identifiers, but cannot embed or
  select executable code, credentials, or arbitrary network destinations.
- Programmable transformations are referenced as reviewed immutable artifacts and run
  outside the application trust boundary; authoring TypeScript is never evaluated as
  part of questionnaire parsing, rendering, or core replay.
- Preview, browser execution, server validation, and replay use the same schema and
  runtime behavior.
- New capabilities require pragmatic tests around public behavior and must preserve
  the repository's configured FlowGraph coverage thresholds.
