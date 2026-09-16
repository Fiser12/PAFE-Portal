import { describe, expect, it } from 'vitest'
import { agruparPorDia, semanaCompleta, semanaDe } from '@/modules/calendario/domain/agrupar'
import type { Ocurrencia } from '@/modules/calendario/domain/ocurrencias'

const evento = (inicio: string, titulo = 'Algo'): Ocurrencia => ({
  uid: titulo,
  titulo,
  inicio: new Date(inicio),
  fin: new Date(inicio),
  diaCompleto: false,
  calendario: 'general',
})

describe('agrupar por día', () => {
  it('junta lo que cae el mismo día y lo ordena por hora', () => {
    const dias = agruparPorDia([
      evento('2026-09-22T16:00:00Z', 'tarde'),
      evento('2026-09-22T08:00:00Z', 'mañana'),
      evento('2026-09-23T08:00:00Z', 'otro día'),
    ])
    expect(dias).toHaveLength(2)
    expect(dias[0]?.ocurrencias.map((o) => o.titulo)).toEqual(['mañana', 'tarde'])
  })

  it('agrupa por el día de Madrid, no por el de UTC', () => {
    // 23:30 UTC del 22 son las 01:30 del 23 en Madrid (verano)
    const dias = agruparPorDia([evento('2026-09-22T23:30:00Z')])
    expect(dias[0]?.dia.toISOString().slice(0, 10)).toBe('2026-09-23')
  })
})

describe('la semana', () => {
  it('empieza en lunes', () => {
    // El 24 de septiembre de 2026 es jueves
    const { desde } = semanaDe(new Date('2026-09-24T10:00:00Z'))
    expect(desde.toISOString().slice(0, 10)).toBe('2026-09-21')
  })

  it('un domingo pertenece a la semana que acaba, no a la siguiente', () => {
    const { desde } = semanaDe(new Date('2026-09-27T10:00:00Z'))
    expect(desde.toISOString().slice(0, 10)).toBe('2026-09-21')
  })

  it('devuelve los siete días aunque estén vacíos', () => {
    const { desde } = semanaDe(new Date('2026-09-24T10:00:00Z'))
    const dias = semanaCompleta([evento('2026-09-24T10:00:00Z')], desde)
    expect(dias).toHaveLength(7)
    expect(dias.filter((d) => d.ocurrencias.length > 0)).toHaveLength(1)
  })
})
