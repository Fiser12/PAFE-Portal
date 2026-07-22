import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

export const createEmptyLexicalEditorState = (): DefaultTypedEditorState => ({
  root: {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [],
        direction: null,
        format: '',
        indent: 0,
        textFormat: 0,
        textStyle: '',
        version: 1,
      },
    ],
    direction: null,
    format: '',
    indent: 0,
    version: 1,
  },
})

export const hasEmptyLexicalRoot = (value: unknown): boolean => {
  if (!value || typeof value !== 'object' || !('root' in value)) return false
  const root = (value as { root?: unknown }).root
  if (!root || typeof root !== 'object' || !('children' in root)) return false
  const children = (root as { children?: unknown }).children
  return Array.isArray(children) && children.length === 0
}
