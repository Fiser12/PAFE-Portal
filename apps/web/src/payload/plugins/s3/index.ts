import type { s3Storage } from "@payloadcms/storage-s3"
import { S3Client } from "@aws-sdk/client-s3"
import { s3Storage as s3StoragePlugin } from "@payloadcms/storage-s3"
import { COLLECTION_SLUG_ADJUNTO, COLLECTION_SLUG_FILES, COLLECTION_SLUG_MEDIA, COLLECTION_SLUG_EXPORTS, COLLECTION_SLUG_IMPORTS } from "@/core/collections-slugs"

export type S3StoragePlugin = Parameters<typeof s3Storage>[0]

export const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  region: process.env.AWS_REGION,
})

/**
 * Dominio público del bucket. Sin él, las imágenes salen por la ruta de Payload:
 * una función que baja el objeto de R2 y lo reenvía, sin caché en ninguna capa.
 */
const dominioPublico = process.env.S3_PUBLIC_URL?.replace(/\/+$/, '')

const urlPublica = (filename: string, prefix?: string): string =>
  [dominioPublico, prefix, encodeURIComponent(filename)].filter(Boolean).join('/')

/**
 * Solo las portadas salen del CDN: son públicas (`read: anyone`) y su nombre
 * lleva el hash del contenido. El resto conserva el control de acceso de
 * Payload, que se perdería al servirlas desde el bucket.
 */
const desdeElCdn = dominioPublico
  ? {
      disablePayloadAccessControl: true as const,
      generateFileURL: ({ filename, prefix }: { filename: string; prefix?: string }) =>
        urlPublica(filename, prefix),
    }
  : {}

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
      ...desdeElCdn,
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
    [COLLECTION_SLUG_ADJUNTO]: {
      disableLocalStorage: true,
      prefix: 'tablon',
    },

  },
})

export default config
