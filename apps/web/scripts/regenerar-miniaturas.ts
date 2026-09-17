/**
 * Vuelve a generar los tamaños de cada imagen para que salgan en WebP.
 *
 * Las carátulas llegan en PNG con canal alfa y Payload las reescalaba sin
 * recomprimir: una miniatura de 300 px pesaba 173 KB de media frente a los
 * 18 KB de las que venían en JPG. Cambiar `formatOptions` solo afecta a lo que
 * se suba a partir de ahora, así que las que ya estaban hay que rehacerlas.
 *
 * Reenvía el original tal cual, con su nombre sin el hash: como el contenido no
 * cambia, `addContentHashToFile` vuelve a calcular el mismo y el fichero
 * original conserva su URL. Lo que cambia son los tamaños, que pasan a .webp.
 * Los PNG viejos quedan huérfanos en el bucket; borrarlos es aparte.
 *
 * Uso (dentro del devcontainer):
 *   cd apps/web && pnpm payload run scripts/regenerar-miniaturas.ts             # solo informa
 *   cd apps/web && APLICAR=1 pnpm payload run scripts/regenerar-miniaturas.ts
 *   cd apps/web && APLICAR=1 LIMITE=3 pnpm payload run scripts/regenerar-miniaturas.ts
 */
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { S3_PLUGIN_CONFIG } from '../src/payload/plugins/s3'

const aplicar = process.env.APLICAR === '1'
const desde = Number(process.env.DESDE ?? 0)
const limite = Number(process.env.LIMITE ?? 0)

const payload = await getPayload({ config })
const s3 = new S3Client(S3_PLUGIN_CONFIG.config)

/** El hook del hash lo añade al guardar: hay que devolver el nombre limpio */
const sinHash = (nombre: string): string => nombre.replace(/-[0-9a-f]{40}(\.[^.]+)$/, '$1')

const bajarDeR2 = async (clave: string): Promise<Buffer> => {
  const objeto = await s3.send(
    new GetObjectCommand({ Bucket: S3_PLUGIN_CONFIG.bucket, Key: clave }),
  )
  return Buffer.from(await objeto.Body!.transformToByteArray())
}

const { docs } = await payload.find({
  collection: 'media',
  limit: 0,
  depth: 0,
  overrideAccess: true,
  sort: 'id',
})

const pendientes = docs.filter(
  (media) =>
    media.filename &&
    media.mimeType?.startsWith('image/') &&
    !Object.values(media.sizes ?? {}).some((talla) => talla?.filename?.endsWith('.webp')),
)

console.log(`${docs.length} imágenes, ${pendientes.length} por rehacer (desde la ${desde})`)
if (!aplicar) {
  console.log('Modo informe. Para rehacerlas: APLICAR=1')
  process.exit(0)
}

let hechas = 0
let fallos = 0

const tanda = limite > 0 ? pendientes.slice(desde, desde + limite) : pendientes.slice(desde)

for (const [indice, media] of tanda.entries()) {
  const clave = media.prefix ? `${media.prefix}/${media.filename}` : media.filename!
  try {
    const datos = await bajarDeR2(clave)
    await payload.update({
      collection: 'media',
      id: media.id,
      data: {},
      file: {
        data: datos,
        name: sinHash(media.filename!),
        mimetype: media.mimeType!,
        size: datos.byteLength,
      },
      overwriteExistingFiles: true,
      overrideAccess: true,
    })
    hechas++
  } catch (error) {
    fallos++
    console.error(`  ✗ ${media.id} ${media.filename}: ${(error as Error).message}`)
  }

  if ((indice + 1) % 25 === 0) {
    console.log(`  ${desde + indice + 1}/${pendientes.length} · ${hechas} hechas, ${fallos} fallos`)
  }
}

console.log(`Listo: ${hechas} rehechas, ${fallos} fallos`)
process.exit(0)
