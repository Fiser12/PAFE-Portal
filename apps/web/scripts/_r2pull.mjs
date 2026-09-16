import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { mkdirSync, createWriteStream, existsSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { pipeline } from 'node:stream/promises'

const DESTINO = process.env.DESTINO
const c = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION || 'auto',
  forcePathStyle: true,
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY },
})

const objetos = []
let token
do {
  const r = await c.send(new ListObjectsV2Command({ Bucket: process.env.S3_BUCKET, ContinuationToken: token }))
  objetos.push(...(r.Contents || []))
  token = r.IsTruncated ? r.NextContinuationToken : undefined
} while (token)

let hechos = 0, saltados = 0
for (const o of objetos) {
  const destino = join(DESTINO, o.Key)
  if (existsSync(destino) && statSync(destino).size === o.Size) { saltados++; continue }
  mkdirSync(dirname(destino), { recursive: true })
  const r = await c.send(new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: o.Key }))
  await pipeline(r.Body, createWriteStream(destino))
  hechos++
  if (hechos % 100 === 0) console.log(`[r2] ${hechos + saltados}/${objetos.length}`)
}
console.log(`[r2] listo: ${hechos} descargados, ${saltados} ya estaban, de ${objetos.length}`)
