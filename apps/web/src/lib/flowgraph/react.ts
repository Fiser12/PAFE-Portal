'use client'

import { flowGraphRuntime } from '@/lib/flowgraph/runtime'
import { numberReactQuestionPlugin } from 'flowgraph-question-number/react'
import { selectReactQuestionPlugin } from 'flowgraph-question-select/react'
import { textReactQuestionPlugin } from 'flowgraph-question-text/react'
import { createReactQuestionPluginRegistry } from 'flowgraph-react'

export const flowGraphReactQuestionPlugins = createReactQuestionPluginRegistry(
  flowGraphRuntime,
  [textReactQuestionPlugin, numberReactQuestionPlugin, selectReactQuestionPlugin],
)
