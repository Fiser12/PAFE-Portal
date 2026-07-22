import { createFlowGraphRuntime, createQuestionPluginRegistry } from 'flowgraph-core'
import { numberQuestionPlugin } from 'flowgraph-question-number'
import { selectQuestionPlugin } from 'flowgraph-question-select'
import { textQuestionPlugin } from 'flowgraph-question-text'

export const flowGraphQuestionPlugins = createQuestionPluginRegistry([
  textQuestionPlugin,
  numberQuestionPlugin,
  selectQuestionPlugin,
])

export const flowGraphRuntime = createFlowGraphRuntime(flowGraphQuestionPlugins)
