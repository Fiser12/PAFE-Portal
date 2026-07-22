# flowgraph-payload-lexical

Payload CMS adapter that attaches native Lexical content to stable FlowGraph page IDs.
FlowGraph schemas remain Payload-independent; Payload owns and persists the rich-text documents.

## Server configuration

```ts
import { createFlowGraphLexicalPageContentsField } from 'flowgraph-payload-lexical'
import { lexicalEditor } from '@payloadcms/richtext-lexical'

export const Questionnaire = {
  slug: 'questionnaires',
  fields: [
    { name: 'schema', type: 'json' },
    createFlowGraphLexicalPageContentsField({
      editor: lexicalEditor(),
    }),
  ],
}
```

Reconcile stored rows after parsing a FlowGraph schema so deleted pages do not leave content behind:

```ts
import { reconcileFlowGraphLexicalPageContents } from 'flowgraph-payload-lexical'

data.pageContents = reconcileFlowGraphLexicalPageContents(schema, data.pageContents)
```

## Admin editor

Mount the client entry inside the application graph's page modal:

```tsx
import { FlowGraphLexicalPageEditor } from 'flowgraph-payload-lexical/client'

<FlowGraphLexicalPageEditor
  collectionSlug="questionnaires"
  nodeID={nodeID}
/>
```

Payload's own sanitized field configuration and `RenderFields` component render the native Lexical
editor. The adapter does not bundle or recreate Lexical.

Application-specific Lexical blocks and JSX converters remain in the host application and are passed
through the normal Payload `lexicalEditor` and `BlocksFeature` APIs.
