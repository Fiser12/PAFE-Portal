import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { JSDOM } from 'jsdom'
import pg from 'pg'
import { archivedCategories, areas, isUpload, sourceOrigin } from './transform.mjs'

const directory = process.env.NODEBB_IMPORT_DIR
if (!directory || !process.env.DATABASE_URL)
  throw new Error('Explicit source and database required')
const source = JSON.parse(readFileSync(join(directory, 'source.json'), 'utf8'))
const client = new pg.Client({ connectionString: process.env.DATABASE_URL })
await client.connect()
try {
  const topics = (
    await client.query(
      'SELECT n.*, l.title, l.body, l._locale AS locale FROM noticia n JOIN noticia_locales l ON l._parent_id=n.id WHERE source_topic_id IS NOT NULL',
    )
  ).rows
  const replies = (await client.query('SELECT * FROM respuesta WHERE source_post_id IS NOT NULL'))
    .rows
  const attachments = (
    await client.query(
      'SELECT id, source_key, area, filesize, filename FROM adjunto WHERE source_key IS NOT NULL',
    )
  ).rows
  const expected = source.topics.filter((t) => !t.deleted)
  const failures = []
  const compact = (value) => value.replace(/\s+/g, '')
  function verifyText(html, body, key) {
    const doc = new JSDOM(html).window.document
    const walker = doc.createTreeWalker(doc.body, 4)
    const text = []
    while (walker.nextNode()) text.push(walker.currentNode.textContent)
    const targetText = []
    let importedImages = 0
    function walk(node) {
      if (typeof node.text === 'string') targetText.push(node.text)
      if (node.type === 'upload') importedImages++
      node.children?.forEach(walk)
    }
    walk(body.root)
    const target = compact(targetText.join(''))
    let position = 0
    for (const fragment of text.map(compact).filter(Boolean)) {
      const found = target.indexOf(fragment, position)
      if (found < 0) {
        failures.push({ key, issue: 'missing text' })
        break
      }
      position = found + fragment.length
    }
    const sourceImages = [...doc.querySelectorAll('img[src]')].filter((img) =>
      isUpload(new URL(img.getAttribute('src'), sourceOrigin)),
    ).length
    if (sourceImages !== importedImages) failures.push({ key, issue: 'image count mismatch' })
    if (JSON.stringify(body).includes('NODEBBIMAGE'))
      failures.push({ key, issue: 'image placeholder' })
  }
  for (const topic of expected) {
    const main = topic.posts.find((p) => p.pid === topic.mainPid && !p.deleted)
    for (const locale of ['es', 'eu']) {
      const row = topics.find((n) => Number(n.source_topic_id) === topic.tid && n.locale === locale)
      if (!row) {
        failures.push({ tid: topic.tid, locale, issue: 'missing topic' })
        continue
      }
      if (row.archivada !== archivedCategories.has(topic.cid) || row.area !== areas.get(topic.cid))
        failures.push({ tid: topic.tid, issue: 'area or archive mismatch' })
      if (
        new Date(row.published_at).getTime() !== topic.timestamp ||
        new Date(row.created_at).getTime() !== topic.timestamp
      )
        failures.push({ tid: topic.tid, issue: 'date mismatch' })
      if (
        new Date(row.updated_at).getTime() !==
        (main?.edited || topic.lastposttime || topic.timestamp)
      )
        failures.push({ tid: topic.tid, issue: 'edit date mismatch' })
      if (!row.notified_at) failures.push({ tid: topic.tid, issue: 'notification not suppressed' })
      if (main) verifyText(main.content, row.body, `topic:${topic.tid}:${locale}`)
    }
    for (const post of topic.posts.filter((p) => p.pid !== topic.mainPid && !p.deleted)) {
      const row = replies.find((r) => Number(r.source_post_id) === post.pid)
      if (!row) failures.push({ pid: post.pid, issue: 'missing reply' })
      else {
        verifyText(post.content, row.body, `post:${post.pid}`)
        if (new Date(row.created_at).getTime() !== post.timestamp)
          failures.push({ pid: post.pid, issue: 'reply date mismatch' })
        if (new Date(row.updated_at).getTime() !== (post.edited || post.timestamp))
          failures.push({ pid: post.pid, issue: 'reply edit date mismatch' })
      }
    }
  }
  const report = {
    topics: topics.length / 2,
    replies: replies.length,
    attachments: attachments.length,
    archived: topics.filter((t) => t.archivada).length / 2,
    failures,
  }
  writeFileSync(
    join(
      directory,
      process.env.NODEBB_VERIFY_PRODUCTION === 'true'
        ? 'production-verification.json'
        : 'local-verification.json',
    ),
    JSON.stringify(report, null, 2),
    { mode: 0o600 },
  )
  console.log(JSON.stringify(report))
  if (failures.length || topics.length !== expected.length * 2) process.exitCode = 1
} finally {
  await client.end()
}
