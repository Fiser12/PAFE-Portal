import { withPayload } from '@payloadcms/next/withPayload'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(dirname, '../..')

const NEXT_PUBLIC_SERVER_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : undefined || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone output for the Docker runner image (traces workspace deps from the monorepo root).
  // Vercel ignores this and uses its own build output.
  output: 'standalone',
  distDir: process.env.NEXT_DIST_DIR || '.next',
  outputFileTracingRoot: repoRoot,
  images: {
    remotePatterns: [
      ...[NEXT_PUBLIC_SERVER_URL, process.env.S3_PUBLIC_URL].filter(Boolean).map((item) => {
        const url = new URL(item)

        return {
          hostname: url.hostname,
          protocol: url.protocol.replace(':', ''),
        }
      }),
    ],
  },
  reactStrictMode: true,
  // Las portadas son públicas y su nombre lleva el hash del contenido: cambiarlas
  // cambia la URL. Sin esto, Payload responde `max-age=0, must-revalidate` y cada
  // carga del catálogo vuelve a pedir las 24 imágenes a la función.
  async headers() {
    return [
      {
        source: '/api/media/file/:ruta*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, s-maxage=31536000, immutable',
          },
        ],
      },
    ]
  },
  // La wiki se publica como HTML plano en public/wiki. Cloudflare Pages resolvía
  // /x -> /x.html por su cuenta; Next no, así que se reescribe aquí. Los ficheros
  // con extensión (css, js, imágenes) no entran en la regla.
  async rewrites() {
    return [
      { source: '/wiki', destination: '/wiki/index.html' },
      { source: '/wiki/:path((?:[^./]+/)*[^./]+)', destination: '/wiki/:path.html' },
    ]
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
