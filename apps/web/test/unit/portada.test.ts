import { describe, expect, it } from 'vitest'
import { portada } from '@/modules/catalog/domain/portada'
import type { Media } from '@/payload-types'

const media = (partes: Partial<Media>): Media =>
  ({ id: 1, updatedAt: '', createdAt: '', ...partes }) as Media

const conTamanos = media({
  url: '/original.jpg',
  width: 1400,
  sizes: {
    thumbnail: { url: '/thumb.jpg', width: 300 },
    square: { url: '/square.jpg', width: 500 },
    small: { url: '/small.jpg', width: 600 },
    medium: { url: '/medium.jpg', width: 900 },
  },
})

describe('portada — qué versión de la imagen se pide', () => {
  it('coge la más pequeña que cubre el ancho', () => {
    expect(portada(conTamanos, 280)).toBe('/thumb.jpg')
    expect(portada(conTamanos, 550)).toBe('/small.jpg')
    expect(portada(conTamanos, 700)).toBe('/medium.jpg')
  })

  it('cae al original cuando ningún tamaño llega', () => {
    expect(portada(conTamanos, 1200)).toBe('/original.jpg')
  })

  it('cae al original cuando no se han generado tamaños', () => {
    expect(portada(media({ url: '/solo.jpg' }), 300)).toBe('/solo.jpg')
  })

  it('ignora los tamaños sin url o sin ancho, que Payload deja a medias', () => {
    const coja = media({
      url: '/original.jpg',
      sizes: {
        thumbnail: { url: null, width: 300 },
        square: { url: '/square.jpg', width: null },
        small: { url: '/small.jpg', width: 600 },
      },
    })
    expect(portada(coja, 280)).toBe('/small.jpg')
  })

  it('sin imagen no hay nada que pedir', () => {
    expect(portada(undefined, 300)).toBeUndefined()
    expect(portada(media({ url: null }), 300)).toBeUndefined()
  })
})
