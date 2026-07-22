import {
  BlocksFeature,
  FixedToolbarFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { QuestionnaireResource } from '@/payload/blocks/QuestionnaireResource/config'

export const questionnaireLexical = lexicalEditor({
  features: ({ rootFeatures }) => [
    ...rootFeatures,
    BlocksFeature({ blocks: [QuestionnaireResource] }),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
    HorizontalRuleFeature(),
  ],
})
