import { describe, expect, it } from 'vitest'
import { mezclar, porDias, type NoticiaDeAgenda } from '@/modules/calendario/domain/entradas'
import type { Ocurrencia } from '@/modules/calendario/domain/ocurrencias'

const evento = (inicio: string, titulo: string): Ocurrencia => ({
  uid: titulo,
  titulo,
  inicio: new Date(inicio),
  fin: new Date(inicio),
  diaCompleto: false,
  calendario: 'general',
})

const noticia = (publicadaEn: string, titulo: string, fijada = false): NoticiaDeAgenda => ({
  id: titulo,
  titulo,
  resumen: '',
  area: 'berriak-pafe',
  fijada,
  publicadaEn,
})

const AHORA = new Date('2026-09-22T12:00:00Z')

describe('la agenda mezcla tablón y calendario', () => {
  it('intercala noticias y eventos por fecha', () => {
    const { cronologia } = mezclar(
      [evento('2026-09-22T08:00:00Z', 'reunión'), evento('2026-09-26T08:00:00Z', 'cineforum')],
      [noticia('2026-09-24T10:00:00Z', 'aviso')],
      AHORA,
    )
    expect(cronologia.map((e) => e.titulo)).toEqual(['reunión', 'aviso', 'cineforum'])
  })

  it('distingue de dónde viene cada cosa', () => {
    const { cronologia } = mezclar(
      [evento('2026-09-22T08:00:00Z', 'reunión')],
      [noticia('2026-09-24T10:00:00Z', 'aviso')],
      AHORA,
    )
    expect(cronologia.map((e) => e.tipo)).toEqual(['evento', 'noticia'])
  })

  it('las noticias llevan a su ficha', () => {
    const { cronologia } = mezclar([], [noticia('2026-09-24T10:00:00Z', 'aviso')], AHORA)
    expect(cronologia[0]).toMatchObject({ tipo: 'noticia', enlace: '/noticias/aviso' })
  })

  it('saca aparte las fijadas, que no deben perderse entre fechas', () => {
    const { fijadas, cronologia } = mezclar(
      [evento('2026-09-22T08:00:00Z', 'reunión')],
      [
        noticia('2026-09-20T10:00:00Z', 'importante', true),
        noticia('2026-09-24T10:00:00Z', 'normal'),
      ],
      AHORA,
    )
    expect(fijadas.map((e) => e.titulo)).toEqual(['importante'])
    expect(cronologia.map((e) => e.titulo)).toEqual(['reunión', 'normal'])
  })

  it('cada entrada tiene clave propia aunque se repita el título', () => {
    const { cronologia } = mezclar(
      [evento('2026-09-22T08:00:00Z', 'igual'), evento('2026-09-23T08:00:00Z', 'igual')],
      [],
      AHORA,
    )
    expect(new Set(cronologia.map((e) => e.id)).size).toBe(2)
  })
})

describe('la agenda no mira hacia atrás', () => {
  it('deja fuera los eventos que ya pasaron', () => {
    const { cronologia } = mezclar(
      [evento('2026-09-15T08:00:00Z', 'la semana pasada'), evento('2026-09-25T08:00:00Z', 'el viernes')],
      [],
      AHORA,
    )
    expect(cronologia.map((e) => e.titulo)).toEqual(['el viernes'])
  })

  it('mantiene lo que queda de hoy, aunque la hora ya haya pasado', () => {
    // Son las 12:00 y el evento era a las 08:00: sigue siendo de hoy
    const { cronologia } = mezclar([evento('2026-09-22T08:00:00Z', 'esta mañana')], [], AHORA)
    expect(cronologia.map((e) => e.titulo)).toEqual(['esta mañana'])
  })

  it('las noticias ya publicadas no se tiran: suben como novedades', () => {
    const { recientes, cronologia } = mezclar(
      [],
      [noticia('2026-09-18T10:00:00Z', 'de la semana pasada')],
      AHORA,
    )
    expect(recientes.map((e) => e.titulo)).toEqual(['de la semana pasada'])
    expect(cronologia).toHaveLength(0)
  })

  it('las novedades van de la más nueva a la más vieja', () => {
    const { recientes } = mezclar(
      [],
      [noticia('2026-09-18T10:00:00Z', 'vieja'), noticia('2026-09-21T10:00:00Z', 'nueva')],
      AHORA,
    )
    expect(recientes.map((e) => e.titulo)).toEqual(['nueva', 'vieja'])
  })
})

describe('el día de hoy en la agenda', () => {
  const ahora = new Date('2026-09-22T12:00:00Z')

  it('marca cuál es hoy', () => {
    const { cronologia } = mezclar(
      [evento('2026-09-22T08:00:00Z', 'de hoy'), evento('2026-09-23T08:00:00Z', 'de mañana')],
      [],
    )
    const { dias } = porDias(cronologia, ahora)
    expect(dias.filter((d) => d.hoy).map((d) => d.entradas[0]?.titulo)).toEqual(['de hoy'])
  })

  it('dice en qué posición está, para poder llevar la vista hasta él', () => {
    const { cronologia } = mezclar(
      [evento('2026-09-20T08:00:00Z', 'pasado'), evento('2026-09-22T08:00:00Z', 'hoy')],
      [],
    )
    const { indiceDeHoy } = porDias(cronologia, ahora)
    expect(indiceDeHoy).toBe(1)
  })

  it('hoy aparece aunque no haya nada ese día', () => {
    const { cronologia } = mezclar([evento('2026-09-28T08:00:00Z', 'la semana que viene')], [])
    const { dias, indiceDeHoy } = porDias(cronologia, ahora)
    expect(indiceDeHoy).toBe(0)
    expect(dias[0]?.entradas).toEqual([])
  })

  it('agrupa por el día de Madrid y no por el de UTC', () => {
    // 23:30 UTC del 22 son las 01:30 del 23 en Madrid
    const { cronologia } = mezclar([evento('2026-09-22T23:30:00Z', 'madrugada')], [])
    const { dias } = porDias(cronologia, ahora)
    const conEntrada = dias.find((d) => d.entradas.length > 0)
    expect(conEntrada?.dia.toISOString().slice(0, 10)).toBe('2026-09-23')
  })
})
