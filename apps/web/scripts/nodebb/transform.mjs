import { JSDOM } from 'jsdom'
import { convertHTMLToLexical } from '@payloadcms/richtext-lexical'

export const areas = new Map([
  [1, 'berriak-pafe'],
  [13, 'berriak-pafe'],
  [6, 'partekatutako-berriak'],
  [14, 'partekatutako-berriak'],
  [5, 'ia'],
  [10, 'elkarrizketa-irekiak'],
  [11, 'pafe-ren-elkarrizketak'],
  [16, 'lantalde-teknikoa'],
  [17, 'lantalde-teknikoa'],
])
export const archivedCategories = new Set([13, 14, 17])
export const sourceOrigin = 'https://foro.pafe-formakuntza.com'
export const isUpload = (url) =>
  url.origin === sourceOrigin && /^\/(assets\/)?uploads\//.test(url.pathname)
export const authorName = (post) => {
  const user = post?.user
  const name = user?.fullname || user?.displayname || user?.username
  return !name || name.includes('[[global:') || name === 'A Former User'
    ? 'Usuario eliminado'
    : name
}
export const plainText = (html) => new JSDOM(html).window.document.body.textContent.trim()

export function transformHTML({ html, area, assets, topics, posts, editorConfig }) {
  const document = new JSDOM(html).window.document
  const images = new Map()
  const rewrite = (raw) => {
    if (raw.startsWith('/api/adjunto/file/') || raw.startsWith('/noticias/')) return raw
    const url = new URL(raw, sourceOrigin)
    if (!['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol)) return null
    if (isUpload(url)) {
      url.hash = ''
      const asset = assets.get(`${area}:${url.href}`)
      if (!asset) throw new Error(`Missing imported attachment: ${url.pathname}`)
      return `/api/adjunto/file/${encodeURIComponent(asset.filename)}`
    }
    if (url.origin === sourceOrigin) {
      const topic = url.pathname.match(/^\/topic\/(\d+)/)
      const post = url.pathname.match(/^\/post\/(\d+)/)
      if (topic && topics.has(Number(topic[1]))) return `/noticias/${topics.get(Number(topic[1]))}`
      if (post && posts.has(Number(post[1]))) return posts.get(Number(post[1]))
    }
    return url.href
  }
  document.querySelectorAll('script,style,form').forEach((el) => el.remove())
  for (const element of document.querySelectorAll('iframe,video')) {
    const src = element.getAttribute('src') || element.querySelector('source')?.getAttribute('src')
    const href = src && rewrite(src)
    if (!href) throw new Error('Media without a supported source URL')
    const link = document.createElement('a')
    link.href = href
    link.textContent = `Vídeo: ${src}`
    element.replaceWith(link)
  }
  for (const element of document.querySelectorAll('img')) {
    const src = element.getAttribute('src')
    if (!src) {
      element.remove()
      continue
    }
    const url = new URL(src, sourceOrigin)
    url.hash = ''
    const asset = assets.get(`${area}:${url.href}`)
    if (isUpload(url) && !asset) throw new Error(`Missing image ${url.pathname}`)
    if (asset) {
      const marker = `NODEBBIMAGE${images.size}END`
      images.set(marker, {
        type: 'upload',
        version: 3,
        relationTo: 'adjunto',
        value: asset.id,
        fields: { alt: element.getAttribute('alt') || '' },
        format: '',
      })
      const paragraph = document.createElement('p')
      paragraph.textContent = marker
      element.replaceWith(paragraph)
    } else {
      const link = document.createElement('a')
      const href = rewrite(src)
      if (!href) {
        element.remove()
        continue
      }
      link.href = href
      link.textContent = element.getAttribute('alt') || 'Imagen externa'
      element.replaceWith(link)
    }
  }
  for (const anchor of document.querySelectorAll('a')) {
    const href = anchor.getAttribute('href')
    const rewritten = href && rewrite(href)
    if (rewritten) anchor.setAttribute('href', rewritten)
    else anchor.replaceWith(...anchor.childNodes)
  }
  for (const heading of document.querySelectorAll('h1,h4,h5,h6')) {
    const replacement = document.createElement(heading.tagName === 'H1' ? 'h2' : 'h3')
    replacement.append(...heading.childNodes)
    heading.replaceWith(replacement)
  }
  const body = convertHTMLToLexical({ editorConfig, html: document.body.innerHTML, JSDOM })
  // Las imágenes pueden venir dentro de enlaces o párrafos de Word. Se
  // separan sus bloques sin perder el texto ni los enlaces que las rodean.
  const expandImages = (node) => {
    if (node.type === 'text')
      return node.text
        .split(/(NODEBBIMAGE\d+END)/)
        .filter(Boolean)
        .map((text) => images.get(text) || { ...node, text })
    if (!node.children) return [node]
    const children = node.children.flatMap(expandImages)
    const result = []
    let group = []
    const flush = () => {
      if (group.length) result.push({ ...node, children: group })
      group = []
    }
    for (const child of children) {
      if (child.type === 'upload') {
        flush()
        result.push(child)
      } else group.push(child)
    }
    flush()
    return result.length ? result : [{ ...node, children: [] }]
  }
  body.root.children = body.root.children.flatMap(expandImages)
  if (JSON.stringify(body).includes('NODEBBIMAGE'))
    throw new Error('Image placeholder was not converted')
  return body
}
