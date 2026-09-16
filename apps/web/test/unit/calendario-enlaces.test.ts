import { describe, expect, it } from 'vitest'
import { enlacesDe, textoLlano } from '@/modules/calendario/domain/enlaces'

describe('los enlaces de un evento', () => {
  it('saca los que van en HTML', () => {
    const descripcion = 'Pinchad aquí: <a href="https://foro.pafe-formakuntza.com/post/24">el libro</a>'
    expect(enlacesDe(descripcion)).toEqual(['https://foro.pafe-formakuntza.com/post/24'])
  })

  it('saca también los escritos a pelo', () => {
    expect(enlacesDe('Más en https://moodle.pafe-formakuntza.com/ gracias')).toEqual([
      'https://moodle.pafe-formakuntza.com/',
    ])
  })

  it('desenvuelve el redirector de Google', () => {
    const descripcion =
      '<a href="https://www.google.com/url?q=https://foro.pafe-formakuntza.com/post/36&amp;sa=D&amp;source=calendar">ver</a>'
    expect(enlacesDe(descripcion)).toEqual(['https://foro.pafe-formakuntza.com/post/36'])
  })

  it('no repite el mismo enlace por salir dos veces', () => {
    const descripcion =
      '<a href="https://foro.pafe-formakuntza.com/post/24">https://foro.pafe-formakuntza.com/post/24</a>'
    expect(enlacesDe(descripcion)).toHaveLength(1)
  })

  it('no se lleva el punto final de la frase', () => {
    expect(enlacesDe('Está en https://moodle.pafe-formakuntza.com/curso.')).toEqual([
      'https://moodle.pafe-formakuntza.com/curso',
    ])
  })

  it('sin descripción no hay enlaces', () => {
    expect(enlacesDe(undefined)).toEqual([])
    expect(enlacesDe('')).toEqual([])
  })
})

describe('la descripción en texto llano', () => {
  it('quita las etiquetas y deshace las entidades', () => {
    expect(textoLlano('Con pausa<br>de 1:30 a 3 &amp; luego tarde')).toBe(
      'Con pausa de 1:30 a 3 & luego tarde',
    )
  })

  it('con una descripción vacía devuelve cadena vacía', () => {
    expect(textoLlano(undefined)).toBe('')
  })
})
