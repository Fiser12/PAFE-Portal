/**
 * Los eventos traen enlaces dentro de la descripción, unas veces en HTML y
 * otras sueltos. Google además los envuelve con su redirector al copiarlos,
 * así que hay que desenvolverlos para que el enlace apunte donde debe.
 */
const HTML_A = /href="([^"]+)"/gi
const SUELTA = /https?:\/\/[^\s<>"')]+/gi

const ENTIDADES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
}

export const desentidad = (texto: string): string =>
  texto.replace(/&(amp|lt|gt|quot|nbsp|#39);/g, (entidad) => ENTIDADES[entidad] ?? entidad)

/** google.com/url?q=LO-QUE-IMPORTA&sa=D&... deja de estorbar */
const desenvolver = (url: string): string => {
  const redirector = url.match(/^https?:\/\/(?:www\.)?google\.com\/url\?q=([^&]+)/i)
  if (!redirector?.[1]) return url
  try {
    return decodeURIComponent(redirector[1])
  } catch {
    return redirector[1]
  }
}

const limpiar = (url: string): string => desenvolver(desentidad(url)).replace(/[.,;:]+$/, '')

export const enlacesDe = (descripcion?: string): string[] => {
  if (!descripcion) return []

  const encontrados = new Set<string>()
  for (const [, url] of descripcion.matchAll(HTML_A)) {
    if (url) encontrados.add(limpiar(url))
  }
  // Fuera del HTML pueden quedar direcciones escritas a pelo
  const sinEtiquetas = descripcion.replace(/<[^>]*>/g, ' ')
  for (const url of sinEtiquetas.match(SUELTA) ?? []) encontrados.add(limpiar(url))

  return [...encontrados]
}

/** La descripción en texto llano, sin etiquetas ni entidades */
export const textoLlano = (descripcion?: string): string =>
  descripcion ? desentidad(descripcion.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, '')).trim() : ''
