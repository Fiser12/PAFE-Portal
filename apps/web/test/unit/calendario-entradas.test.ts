import { describe, expect, it } from 'vitest'
import {
  aEntradas,
  diasQueOcupa,
  porDias,
  sieteDias,
  tieneFranja,
  type Entrada,
} from '@/modules/calendario/domain/entradas'
import type { Ocurrencia } from '@/modules/calendario/domain/ocurrencias'

const evento = (inicio: string, titulo: string, fin = inicio): Ocurrencia => ({
  uid: titulo,
  titulo,
  inicio: new Date(inicio),
  fin: new Date(fin),
  diaCompleto: false,
  calendario: 'general',
})

const jornadas = (desde: string, hastaExclusivo: string, titulo: string): Ocurrencia => ({
  ...evento(`${desde}T00:00:00Z`, titulo, `${hastaExclusivo}T00:00:00Z`),
  diaCompleto: true,
})

const entrada = (ocurrencia: Ocurrencia): Entrada => aEntradas([ocurrencia])[0]!

describe('la agenda solo enseña actividades', () => {
  it('ordena los eventos por fecha', () => {
    const entradas = aEntradas([
      evento('2026-09-26T08:00:00Z', 'cineforum'),
      evento('2026-09-22T08:00:00Z', 'reunión'),
    ])
    expect(entradas.map((e) => e.titulo)).toEqual(['reunión', 'cineforum'])
  })

  it('cada entrada tiene clave propia aunque se repita el título', () => {
    const entradas = aEntradas([
      evento('2026-09-22T08:00:00Z', 'igual'),
      evento('2026-09-23T08:00:00Z', 'igual'),
    ])
    expect(new Set(entradas.map((e) => e.id)).size).toBe(2)
  })

  it('conserva de qué calendario viene, que es lo que da el color', () => {
    expect(entrada(evento('2026-09-22T08:00:00Z', 'reunión')).calendario).toBe('general')
  })
})

describe('los días que ocupa un evento', () => {
  it('un evento con hora ocupa su día', () => {
    expect(diasQueOcupa(entrada(evento('2026-09-22T08:00:00Z', 'a', '2026-09-22T10:00:00Z')))).toEqual([
      '2026-09-22',
    ])
  })

  it('una jornada completa ocupa un solo día aunque el fin sea el día siguiente', () => {
    // En iCalendar el DTEND de un día completo es exclusivo
    expect(diasQueOcupa(entrada(jornadas('2026-09-04', '2026-09-05', 'lagunarte')))).toEqual([
      '2026-09-04',
    ])
  })

  it('una jornada sin fin ocupa su día', () => {
    expect(diasQueOcupa(entrada(jornadas('2026-09-04', '2026-09-04', 'suelta')))).toEqual([
      '2026-09-04',
    ])
  })

  it('una exposición de varios días los ocupa todos, sin el del fin exclusivo', () => {
    expect(diasQueOcupa(entrada(jornadas('2026-09-25', '2026-09-28', 'okendo')))).toEqual([
      '2026-09-25',
      '2026-09-26',
      '2026-09-27',
    ])
  })

  it('lo que pasa de medianoche en Madrid ocupa dos días', () => {
    // 21:00 UTC son las 23:00 en Madrid; 23:30 UTC, la 01:30 del día siguiente
    expect(
      diasQueOcupa(entrada(evento('2026-09-22T21:00:00Z', 'noche', '2026-09-22T23:30:00Z'))),
    ).toEqual(['2026-09-22', '2026-09-23'])
  })

  it('acabar justo a medianoche no invade el día siguiente', () => {
    // 22:00 UTC son las 00:00 del 23 en Madrid
    expect(
      diasQueOcupa(entrada(evento('2026-09-22T20:00:00Z', 'hasta las doce', '2026-09-22T22:00:00Z'))),
    ).toEqual(['2026-09-22'])
  })
})

describe('qué va en la rejilla horaria', () => {
  it('lo que tiene hora y cabe en un día tiene franja', () => {
    expect(tieneFranja(entrada(evento('2026-09-22T08:00:00Z', 'a', '2026-09-22T09:00:00Z')))).toBe(true)
  })

  it('una jornada completa no tiene franja', () => {
    expect(tieneFranja(entrada(jornadas('2026-09-04', '2026-09-05', 'b')))).toBe(false)
  })

  it('lo que dura varios días no tiene franja, aunque tenga hora', () => {
    expect(
      tieneFranja(entrada(evento('2026-09-22T08:00:00Z', 'c', '2026-09-24T18:00:00Z'))),
    ).toBe(false)
  })
})

describe('la agenda por días', () => {
  const ahora = new Date('2026-09-26T12:00:00Z')

  it('marca cuál es hoy', () => {
    const { dias } = porDias(
      aEntradas([evento('2026-09-26T08:00:00Z', 'de hoy'), evento('2026-09-27T08:00:00Z', 'de mañana')]),
      ahora,
    )
    expect(dias.filter((d) => d.hoy).map((d) => d.entradas[0]?.titulo)).toEqual(['de hoy'])
  })

  it('dice en qué posición está hoy, para poder llevar la vista hasta él', () => {
    const { indiceDeHoy } = porDias(
      aEntradas([evento('2026-09-24T08:00:00Z', 'pasado'), evento('2026-09-26T08:00:00Z', 'hoy')]),
      ahora,
    )
    expect(indiceDeHoy).toBe(1)
  })

  it('hoy aparece aunque no haya nada ese día', () => {
    const { dias, indiceDeHoy } = porDias(aEntradas([evento('2026-09-30T08:00:00Z', 'luego')]), ahora)
    expect(indiceDeHoy).toBe(0)
    expect(dias[0]?.entradas).toEqual([])
  })

  it('agrupa por el día de Madrid y no por el de UTC', () => {
    const { dias } = porDias(aEntradas([evento('2026-09-26T23:30:00Z', 'madrugada')]), ahora)
    const conEntrada = dias.find((d) => d.entradas.length > 0)
    expect(conEntrada?.dia.toISOString().slice(0, 10)).toBe('2026-09-27')
  })

  it('lo de varios días sale en cada uno, con el día que es de cuántos', () => {
    const { dias } = porDias(aEntradas([jornadas('2026-09-25', '2026-09-28', 'okendo')]), ahora)
    const okendo = dias.flatMap((d) =>
      d.entradas.map((e) => [d.dia.toISOString().slice(0, 10), e.tramo]),
    )
    expect(okendo).toEqual([
      ['2026-09-25', { dia: 1, de: 3 }],
      ['2026-09-26', { dia: 2, de: 3 }],
      ['2026-09-27', { dia: 3, de: 3 }],
    ])
  })

  it('lo de un solo día no lleva tramo', () => {
    const { dias } = porDias(aEntradas([evento('2026-09-26T08:00:00Z', 'suelto')]), ahora)
    expect(dias.flatMap((d) => d.entradas)[0]?.tramo).toBeUndefined()
  })

  it('cada copia diaria tiene clave propia', () => {
    const { dias } = porDias(aEntradas([jornadas('2026-09-25', '2026-09-28', 'okendo')]), ahora)
    const ids = dias.flatMap((d) => d.entradas.map((e) => e.id))
    expect(new Set(ids).size).toBe(3)
  })

  it('no enseña los días anteriores al corte, aunque el evento siga en curso', () => {
    const { dias } = porDias(
      aEntradas([jornadas('2026-09-20', '2026-09-28', 'larga')]),
      ahora,
      'Europe/Madrid',
      new Date('2026-09-26T00:00:00Z'),
    )
    expect(dias.map((d) => d.dia.toISOString().slice(0, 10))).toEqual(['2026-09-26', '2026-09-27'])
    expect(dias[0]?.entradas[0]?.tramo).toEqual({ dia: 7, de: 8 })
  })
})

describe('la semana', () => {
  const ahora = new Date('2026-09-24T12:00:00Z')
  const lunes = new Date('2026-09-21T00:00:00Z')

  it('reparte los eventos en sus días', () => {
    const dias = sieteDias(aEntradas([evento('2026-09-22T08:00:00Z', 'reunión')]), lunes, ahora)
    expect(dias).toHaveLength(7)
    expect(dias[1]?.entradas.map((e) => e.titulo)).toEqual(['reunión'])
  })

  it('lo que empezó la semana anterior sigue saliendo en esta', () => {
    const dias = sieteDias(aEntradas([jornadas('2026-09-19', '2026-09-23', 'puente')]), lunes, ahora)
    expect(dias.map((d) => d.entradas.length)).toEqual([1, 1, 0, 0, 0, 0, 0])
    expect(dias[1]?.entradas[0]?.tramo).toEqual({ dia: 4, de: 4 })
  })

  it('marca cuál de los siete es hoy', () => {
    expect(sieteDias([], lunes, ahora).findIndex((d) => d.hoy)).toBe(3)
  })

  it('una semana sin nada sigue teniendo siete días', () => {
    const dias = sieteDias([], new Date('2030-01-07T00:00:00Z'), ahora)
    expect(dias).toHaveLength(7)
    expect(dias.every((d) => d.entradas.length === 0)).toBe(true)
  })
})
