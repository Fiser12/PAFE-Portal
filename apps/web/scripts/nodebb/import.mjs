import { readFileSync, writeFileSync } from 'node:fs'
import { join, basename } from 'node:path'
import { createHash } from 'node:crypto'
import { getPayload } from 'payload'
import pg from 'pg'
import { editorConfigFactory } from '@payloadcms/richtext-lexical'
import {
  areas,
  archivedCategories,
  sourceOrigin,
  authorName,
  plainText,
  transformHTML,
} from './transform.mjs'

const directory = process.env.NODEBB_IMPORT_DIR
if (!directory || process.env.NODEBB_IMPORT_APPLY !== 'true')
  throw new Error('Explicit import directory and apply flag required')
const sourceRaw = readFileSync(join(directory, 'source.json'), 'utf8')
const digest = createHash('sha256').update(sourceRaw).digest('hex')
if (digest !== readFileSync(join(directory, 'source.sha256'), 'utf8').trim())
  throw new Error('Source checksum mismatch')
const source = JSON.parse(sourceRaw)
if (
  source.source !== sourceOrigin ||
  new Set(source.topics.map((t) => t.tid)).size !== source.topics.length
)
  throw new Error('Invalid export')
const manifest = JSON.parse(readFileSync(join(directory, 'assets.json'), 'utf8'))
for (const asset of manifest) {
  if (
    asset.error ||
    !asset.sha256 ||
    !asset.mimeType ||
    !/^assets\/[a-f0-9]{64}\.[a-z0-9]+$/.test(asset.file)
  )
    throw new Error('Incomplete asset manifest')
  if (
    createHash('sha256')
      .update(readFileSync(join(directory, asset.file)))
      .digest('hex') !== asset.sha256
  )
    throw new Error('Asset checksum mismatch')
}
const localTest = process.env.NODEBB_IMPORT_TEST === 'true'
const url = new URL(localTest ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL)
if (
  localTest &&
  (!['test_db', 'localhost'].includes(url.hostname) ||
    !url.pathname.endsWith('/pafe_nodebb_import'))
)
  throw new Error('Not an isolated import database')
if (!localTest && process.env.NODEBB_IMPORT_PRODUCTION !== url.hostname)
  throw new Error('Production host not confirmed')
if (
  process.env.PAYLOAD_DISABLE_PUSH !== 'true' ||
  process.env.PAYLOAD_RUN_MIGRATIONS !== 'false' ||
  process.env.SEED_MOCK_DATA !== 'false'
)
  throw new Error('Unsafe Payload environment')
let config
if (localTest) {
  const { buildTestConfig } = await import('../../test/vertical/helpers/test-config.ts')
  config = await buildTestConfig()
  const collection = config.collections.find((c) => c.slug === 'adjunto')
  collection.upload.staticDir = join(directory, 'test-uploads')
} else {
  config = (await import('../../src/payload.config.ts')).default
}
const payload = await getPayload({ config })
const bodyField = payload.config.collections
  .find((c) => c.slug === 'noticia')
  .fields.find((f) => f.name === 'body')
const editorConfig = editorConfigFactory.fromField({ field: bodyField })
const topicsToImport = source.topics.filter((t) => !t.deleted)
if (topicsToImport.some((t) => !areas.has(t.cid))) throw new Error('Unmapped category')
const context = { saltarAvisoDelTablon: true }
const countsBefore = {}
for (const collection of ['noticia', 'respuesta', 'adjunto', 'notification'])
  countsBefore[collection] = (await payload.count({ collection })).totalDocs
const assets = new Map()
const topics = new Map()
const posts = new Map()
const replies = new Map()
const report = { sourceHash: digest, topics: [], replies: [], assets: [], countsBefore }
const reportFile = join(
  directory,
  localTest ? 'local-import-report.json' : 'production-import-report.json',
)
const saveReport = () => writeFileSync(reportFile, JSON.stringify(report, null, 2), { mode: 0o600 })
async function existing(collection, field, value) {
  return (
    await payload.find({
      collection,
      where: { [field]: { equals: value } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
  ).docs[0]
}
for (const asset of manifest) {
  const usedIn = new Set(
    topicsToImport
      .filter(
        (t) =>
          asset.topics.includes(t.tid) &&
          t.posts.some((p) => !p.deleted && asset.posts.includes(p.pid)),
      )
      .map((t) => areas.get(t.cid)),
  )
  for (const area of usedIn) {
    const sourceKey = `${area}:${asset.url}`
    let doc = await existing('adjunto', 'sourceKey', sourceKey)
    if (!doc) {
      const originalName = decodeURIComponent(basename(new URL(asset.url).pathname))
      doc = await payload.create({
        collection: 'adjunto',
        overrideAccess: true,
        data: { sourceKey, area, alt: originalName },
        file: {
          data: readFileSync(join(directory, asset.file)),
          name: originalName,
          mimetype: asset.mimeType,
          size: asset.size,
        },
      })
    }
    assets.set(sourceKey, { id: doc.id, filename: doc.filename })
    report.assets.push({
      sourceKey,
      id: doc.id,
      filename: doc.filename,
      sourceSha256: asset.sha256,
    })
    if (report.assets.length % 25 === 0) {
      saveReport()
      console.log(JSON.stringify({ phase: 'assets', imported: report.assets.length }))
    }
  }
}
saveReport()
for (const topic of topicsToImport) {
  const main = topic.posts.find((p) => p.pid === topic.mainPid && !p.deleted)
  let doc = await existing('noticia', 'sourceTopicId', topic.tid)
  if (!doc)
    doc = await payload.create({
      collection: 'noticia',
      overrideAccess: true,
      context,
      data: {
        sourceTopicId: topic.tid,
        sourceAuthor: authorName(main),
        sourceAuthorId: main?.uid ?? topic.uid,
        title: topic.titleRaw || plainText(topic.title),
        area: areas.get(topic.cid),
        publishedAt: '2100-01-01T00:00:00.000Z',
        notifiedAt: source.exportedAt,
        archivada: archivedCategories.has(topic.cid),
        pinned: Boolean(topic.pinned),
        cerrada: Boolean(topic.locked),
        createdAt: new Date(topic.timestamp).toISOString(),
      },
    })
  topics.set(topic.tid, doc.id)
  if (topic.mainPid) posts.set(topic.mainPid, `/noticias/${doc.id}`)
  report.topics.push({ tid: topic.tid, id: doc.id, archived: archivedCategories.has(topic.cid) })
}
for (const topic of topicsToImport) {
  for (const post of topic.posts.filter((p) => !p.deleted && p.pid !== topic.mainPid)) {
    let doc = await existing('respuesta', 'sourcePostId', post.pid)
    if (!doc)
      doc = await payload.create({
        collection: 'respuesta',
        overrideAccess: true,
        data: {
          sourcePostId: post.pid,
          sourceAuthor: authorName(post),
          sourceAuthorId: post.uid,
          noticia: topics.get(topic.tid),
          mensaje: plainText(post.content) || '[Adjunto]',
          createdAt: new Date(post.timestamp).toISOString(),
        },
      })
    replies.set(post.pid, doc.id)
    posts.set(post.pid, `/noticias/${topics.get(topic.tid)}#respuesta-${doc.id}`)
    report.replies.push({ pid: post.pid, id: doc.id })
  }
}
saveReport()
const prepared = []
for (const topic of topicsToImport) {
  const main = topic.posts.find((p) => p.pid === topic.mainPid && !p.deleted)
  const area = areas.get(topic.cid)
  const convert = (html) => transformHTML({ html, area, assets, topics, posts, editorConfig })
  const body = convert(
    main?.content || '<p>Este tema no conserva publicaciones en el foro original.</p>',
  )
  const convertedReplies = topic.posts
    .filter((p) => !p.deleted && p.pid !== topic.mainPid)
    .map((p) => ({ post: p, body: convert(p.content) }))
  prepared.push({ topic, main, body, convertedReplies })
}
for (const { topic, main, body, convertedReplies } of prepared) {
  for (const { post, body: replyBody } of convertedReplies) {
    await payload.update({
      collection: 'respuesta',
      id: replies.get(post.pid),
      overrideAccess: true,
      data: { body: replyBody, updatedAt: new Date(post.edited || post.timestamp).toISOString() },
    })
  }
  for (const locale of ['es', 'eu'])
    await payload.update({
      collection: 'noticia',
      id: topics.get(topic.tid),
      overrideAccess: true,
      context,
      locale,
      data: {
        title: topic.titleRaw || plainText(topic.title),
        body,
        publishedAt: new Date(topic.timestamp).toISOString(),
        updatedAt: new Date(main?.edited || topic.lastposttime || topic.timestamp).toISOString(),
      },
    })
  if (topic.tid % 20 === 0) console.log(JSON.stringify({ phase: 'content', tid: topic.tid }))
}
// Payload actualiza updatedAt al editar. Restauramos únicamente las fechas de
// las filas identificadas como importadas, sin ejecutar hooks ni cambiar contenido.
const database = new pg.Client({ connectionString: url.href })
await database.connect()
try {
  await database.query('BEGIN')
  for (const { topic, main, convertedReplies } of prepared) {
    const changed = await database.query(
      'UPDATE noticia SET updated_at = $1 WHERE id = $2 AND source_topic_id = $3',
      [
        new Date(main?.edited || topic.lastposttime || topic.timestamp).toISOString(),
        topics.get(topic.tid),
        topic.tid,
      ],
    )
    if (changed.rowCount !== 1) throw new Error('Topic timestamp target mismatch')
    for (const { post } of convertedReplies) {
      const reply = await database.query(
        'UPDATE respuesta SET updated_at = $1 WHERE id = $2 AND source_post_id = $3',
        [new Date(post.edited || post.timestamp).toISOString(), replies.get(post.pid), post.pid],
      )
      if (reply.rowCount !== 1) throw new Error('Reply timestamp target mismatch')
    }
  }
  await database.query('COMMIT')
} catch (error) {
  await database.query('ROLLBACK')
  throw error
} finally {
  await database.end()
}
report.countsAfter = {}
for (const collection of ['noticia', 'respuesta', 'adjunto', 'notification'])
  report.countsAfter[collection] = (await payload.count({ collection })).totalDocs
report.completedAt = new Date().toISOString()
saveReport()
if (report.countsBefore.notification !== report.countsAfter.notification)
  throw new Error('Notification count changed during import')
const imported = await payload.find({
  collection: 'noticia',
  where: { sourceTopicId: { exists: true } },
  pagination: false,
  depth: 0,
})
if (
  imported.docs.length !== topicsToImport.length ||
  imported.docs.some((n) => !n.notifiedAt || n.publishedAt.startsWith('2100'))
)
  throw new Error('Incomplete import')
console.log(
  JSON.stringify({
    complete: true,
    topics: report.topics.length,
    replies: report.replies.length,
    assets: report.assets.length,
    countsBefore,
    countsAfter: report.countsAfter,
  }),
)
await payload.destroy()
