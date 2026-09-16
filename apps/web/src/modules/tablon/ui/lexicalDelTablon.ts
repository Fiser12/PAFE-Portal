import {
  BoldFeature,
  HeadingFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnderlineFeature,
  UnorderedListFeature,
  UploadFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { COLLECTION_SLUG_ADJUNTO } from '@/core/collections-slugs'

/**
 * El editor del tablón. Añade al del portal la posibilidad de incrustar
 * imágenes y documentos en el punto del texto donde van, en lugar de dejarlos
 * en una lista aparte. Lo subido acaba en el S3 del portal, como el resto:
 * `adjunto` está enganchada ahí, y va aparte del catálogo.
 */
export const lexicalDelTablon = lexicalEditor({
  features: [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    LinkFeature({}),
    UploadFeature({
      collections: {
        [COLLECTION_SLUG_ADJUNTO]: { fields: [] },
      },
    }),
  ],
})
