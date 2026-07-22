import type { ArrayField, RichTextField } from 'payload'

import {
  DEFAULT_CONTENT_FIELD,
  DEFAULT_PAGE_CONTENTS_FIELD,
  DEFAULT_PAGE_ID_FIELD,
} from './constants'

export type FlowGraphLexicalPageContentsFieldOptions = {
  editor: NonNullable<RichTextField['editor']>
  name?: string
  pageIDFieldName?: string
  contentFieldName?: string
  label?: ArrayField['label']
}

export const createFlowGraphLexicalPageContentsField = ({
  editor,
  name = DEFAULT_PAGE_CONTENTS_FIELD,
  pageIDFieldName = DEFAULT_PAGE_ID_FIELD,
  contentFieldName = DEFAULT_CONTENT_FIELD,
  label = 'FlowGraph page content',
}: FlowGraphLexicalPageContentsFieldOptions): ArrayField => ({
  name,
  label,
  type: 'array',
  admin: { hidden: true },
  fields: [
    {
      name: pageIDFieldName,
      label: 'FlowGraph page ID',
      type: 'text',
      required: true,
    },
    {
      name: contentFieldName,
      label: false,
      type: 'richText',
      editor,
    },
  ],
})
