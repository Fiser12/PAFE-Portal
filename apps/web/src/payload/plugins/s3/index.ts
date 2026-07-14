import type { s3Storage } from "@payloadcms/storage-s3"
import { S3Client } from "@aws-sdk/client-s3"
import { s3Storage as s3StoragePlugin } from "@payloadcms/storage-s3"
import { COLLECTION_SLUG_FILES, COLLECTION_SLUG_MEDIA, COLLECTION_SLUG_EXPORTS, COLLECTION_SLUG_IMPORTS } from "@/core/collections-slugs"

export type S3StoragePlugin = Parameters<typeof s3Storage>[0]

export const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  region: process.env.AWS_REGION,
})

export const S3_PLUGIN_CONFIG: S3StoragePlugin = {
  collections: {},
  bucket: process.env.S3_BUCKET!,
  config: {
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
  },
}

const config = s3StoragePlugin({
  ...S3_PLUGIN_CONFIG,
  collections: {
    [COLLECTION_SLUG_MEDIA]: {
      disableLocalStorage: true,
      prefix: 'media',
    },
    [COLLECTION_SLUG_FILES]: {
      disableLocalStorage: true,
      prefix: 'files',
    },
    [COLLECTION_SLUG_EXPORTS]: {
      disableLocalStorage: true,
      prefix: 'exports',
    },
    [COLLECTION_SLUG_IMPORTS]: {
      disableLocalStorage: true,
      prefix: 'imports',
    },

  },
})

export default config
