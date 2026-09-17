import type { CollectionConfig } from 'payload'

import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'
import { COLLECTION_SLUG_MEDIA } from '@/core/collections-slugs'

import { anyone } from '../../access/anyone'
import { addContentHashToFile } from '@/payload/hooks/addContentHashToFileHook'
import { handleSvgUpload } from '@/payload/hooks/handleSvgUploadHook'
import { updateCacheControl } from '@/payload/hooks/updateCacheControl'
import { hiddenUnlessCatalogo, catalogoAccess } from '@/core/permissions'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const WEBP = { format: 'webp' as const, options: { quality: 82 } }

export const Media: CollectionConfig = {
  slug: COLLECTION_SLUG_MEDIA,
  access: {
    create: catalogoAccess,
    delete: catalogoAccess,
    read: anyone,
    update: catalogoAccess,
  },
  admin: {
    hidden: hiddenUnlessCatalogo,
  },
  hooks: {
    beforeOperation: [addContentHashToFile],
    afterChange: [updateCacheControl, handleSvgUpload],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      localized: true,
      //required: true,
    },
    {
      name: 'caption',
      type: 'richText',
      localized: true,
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
  ],
  upload: {
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
    staticDir: path.resolve(dirname, '../../public/media'),
    adminThumbnail: 'thumbnail',
    focalPoint: true,
    // Las carátulas llegan en PNG con canal alfa: al reescalarlas sin recomprimir,
    // una miniatura de 300 px pesaba 173 KB de media frente a los 18 KB de las JPG.
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
        formatOptions: WEBP,
      },
      {
        name: 'square',
        width: 500,
        height: 500,
        formatOptions: WEBP,
      },
      {
        name: 'small',
        width: 600,
        formatOptions: WEBP,
      },
      {
        name: 'medium',
        width: 900,
        formatOptions: WEBP,
      },
      {
        name: 'large',
        width: 1400,
        formatOptions: WEBP,
      },
      {
        name: 'xlarge',
        width: 1920,
        formatOptions: WEBP,
      },
      {
        name: 'og',
        width: 1200,
        height: 630,
        crop: 'center',
        formatOptions: WEBP,
      },
    ],
  },
}
