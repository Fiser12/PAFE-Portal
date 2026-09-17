import type { Media } from '@/payload-types'

/**
 * Payload genera siete tamaños de cada imagen, pero el campo `url` apunta al
 * original: una portada de 1400 px acababa sirviéndose en una caja de 300.
 * Devuelve la versión más pequeña que cubre el ancho pedido.
 */
export const portada = (
  media: Media | null | undefined,
  anchoMinimo: number,
): string | undefined => {
  if (!media) return undefined

  const candidatas = Object.values(media.sizes ?? {})
    .filter((talla) => talla?.url && typeof talla.width === 'number')
    .map((talla) => ({ url: talla!.url as string, ancho: talla!.width as number }))
    .filter((talla) => talla.ancho >= anchoMinimo)
    .sort((a, b) => a.ancho - b.ancho)

  return candidatas[0]?.url ?? media.url ?? undefined
}
