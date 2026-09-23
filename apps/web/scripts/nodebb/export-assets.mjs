import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, join, extname } from 'node:path'
import { createHash } from 'node:crypto'
import { JSDOM } from 'jsdom'

const directory = resolve(process.argv[2])
const source = JSON.parse(readFileSync(join(directory, 'source.json'), 'utf8'))
if (source.source !== 'https://foro.pafe-formakuntza.com') throw new Error('Unexpected source')
const assetDirectory = join(directory, 'assets')
mkdirSync(assetDirectory, { recursive: true, mode: 0o700 })
const assets = new Map()
for (const topic of source.topics) {
  for (const post of topic.posts) {
    const document = new JSDOM(post.content).window.document
    for (const element of document.querySelectorAll('[href], [src]')) {
      for (const attribute of ['href', 'src']) {
        const value = element.getAttribute(attribute)
        if (!value) continue
        const url = new URL(value, source.source)
        if (url.origin !== source.source || !/^\/(assets\/)?uploads\//.test(url.pathname)) continue
        url.hash = ''
        if (!assets.has(url.href)) assets.set(url.href, { url: url.href, topics: [], posts: [] })
        const asset = assets.get(url.href)
        if (!asset.topics.includes(topic.tid)) asset.topics.push(topic.tid)
        if (!asset.posts.includes(post.pid)) asset.posts.push(post.pid)
      }
    }
  }
}
let finished = 0
const entries = [...assets.values()]
const failures = []
let cursor = 0
const save = () =>
  writeFileSync(join(directory, 'assets.json'), JSON.stringify(entries, null, 2), { mode: 0o600 })
async function worker() {
  while (cursor < entries.length) {
    const asset = entries[cursor++]
    const key = createHash('sha256').update(asset.url).digest('hex')
    const suffix = extname(new URL(asset.url).pathname).toLowerCase()
    asset.file = `assets/${key}${suffix}`
    const file = join(directory, asset.file)
    try {
      let bytes
      if (existsSync(file)) bytes = readFileSync(file)
      else {
        const response = await fetch(asset.url, {
          redirect: 'error',
          signal: AbortSignal.timeout(120000),
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        asset.mimeType = response.headers.get('content-type')?.split(';')[0]
        if (asset.mimeType === 'text/html') throw new Error('Unexpected HTML instead of an asset')
        bytes = Buffer.from(await response.arrayBuffer())
        if (!bytes.length) throw new Error('Empty file')
        writeFileSync(file, bytes, { mode: 0o600, flag: 'wx' })
      }
      asset.size = bytes.length
      asset.sha256 = createHash('sha256').update(bytes).digest('hex')
    } catch (error) {
      asset.error = error.message
      failures.push({ url: asset.url, error: error.message })
    }
    finished++
    if (finished % 25 === 0 || finished === entries.length) {
      save()
      console.log(JSON.stringify({ finished, total: entries.length, failures: failures.length }))
    }
  }
}
await Promise.all(Array.from({ length: 4 }, worker))
save()
console.log(
  JSON.stringify({
    assets: entries.length,
    bytes: entries.reduce((n, a) => n + (a.size || 0), 0),
    failures,
  }),
)
if (failures.length) process.exitCode = 1
