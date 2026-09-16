import { describe, expect, it } from 'vitest'
import type { Entrada } from '@/modules/calendario/domain/entradas'
import { colocar, rangoDe, sinHora } from '@/modules/calendario/domain/rejilla'

const evento = (desde: string, hasta: string, titulo = 'algo'): Entrada => ({
  tipo: 'evento',
  id: titulo,
  fecha: new Date(desde),
  fin: new Date(hasta),
  titulo,
  diaCompleto: false,
  calendario: 'general',
  descripcion: '',
  enlaces: [],
})

const todoElDia = (dia: string, titulo = 'jornada'): Entrada => ({
  ...(evento(dia, dia, titulo) as Extract<Entrada, { tipo: 'evento' }>),
  diaCompleto: true,
})

const noticia: Entrada = {
  tipo: 'noticia',
  id: 'n',
  fecha: new Date('2026-09-22T10:00:00Z'),
  titulo: 'aviso',
  resumen: '',
  area: 'berriak-pafe',
  fijada: false,
  enlace: '/noticias/1',
}

describe('el rango de horas que se dibuja', () => {
  it('sin eventos usa un horario razonable', () => {
    expect(rangoDe([])).toEqual({ primeraHora: 8, ultimaHora: 20 })
  })

  it('se estira para que quepa lo que empieza antes', () => {
    // 05:00 UTC son las 07:00 en Madrid, en verano
    const rango = rangoDe([evento('2026-09-22T05:00:00Z', '2026-09-22T06:00:00Z')])
    expect(rango.primeraHora).toBe(7)
  })

  it('se estira para que quepa lo que acaba después', () => {
    // 20:00 UTC son las 22:00 en Madrid
    const rango = rangoDe([evento('2026-09-22T19:00:00Z', '2026-09-22T20:00:00Z')])
    expect(rango.ultimaHora).toBe(22)
  })

  it('no se estira por los de día completo, que no tienen hora', () => {
    expect(rangoDe([todoElDia('2026-09-22T00:00:00Z')])).toEqual({ primeraHora: 8, ultimaHora: 20 })
  })
})

describe('colocar los eventos en la rejilla', () => {
  const rango = { primeraHora: 8, ultimaHora: 20 }

  it('calcula dónde empieza y cuánto ocupa', () => {
    // 08:00 UTC son las 10:00 en Madrid: dos horas después del arranque
    const [bloque] = colocar([evento('2026-09-22T08:00:00Z', '2026-09-22T09:30:00Z')], rango)
    expect(bloque?.desde).toBe(120)
    expect(bloque?.alto).toBe(90)
  })

  it('da un alto mínimo a lo muy corto, para que se pueda leer', () => {
    const [bloque] = colocar([evento('2026-09-22T08:00:00Z', '2026-09-22T08:05:00Z')], rango)
    expect(bloque?.alto).toBe(30)
  })

  it('lo que no se pisa ocupa todo el ancho', () => {
    const bloques = colocar(
      [
        evento('2026-09-22T08:00:00Z', '2026-09-22T09:00:00Z', 'uno'),
        evento('2026-09-22T10:00:00Z', '2026-09-22T11:00:00Z', 'otro'),
      ],
      rango,
    )
    expect(bloques.map((b) => b.columnas)).toEqual([1, 1])
  })

  it('reparte el ancho entre los que se pisan', () => {
    const bloques = colocar(
      [
        evento('2026-09-22T08:00:00Z', '2026-09-22T10:00:00Z', 'largo'),
        evento('2026-09-22T08:30:00Z', '2026-09-22T09:30:00Z', 'dentro'),
      ],
      rango,
    )
    expect(bloques.map((b) => b.columnas)).toEqual([2, 2])
    expect(bloques.map((b) => b.columna)).toEqual([0, 1])
  })

  it('tres a la vez se reparten en tres', () => {
    const bloques = colocar(
      [
        evento('2026-09-22T08:00:00Z', '2026-09-22T10:00:00Z', 'a'),
        evento('2026-09-22T08:15:00Z', '2026-09-22T10:00:00Z', 'b'),
        evento('2026-09-22T08:30:00Z', '2026-09-22T10:00:00Z', 'c'),
      ],
      rango,
    )
    expect(bloques.every((b) => b.columnas === 3)).toBe(true)
    expect(new Set(bloques.map((b) => b.columna)).size).toBe(3)
  })

  it('un grupo de solapes no estrecha al siguiente', () => {
    const bloques = colocar(
      [
        evento('2026-09-22T08:00:00Z', '2026-09-22T09:00:00Z', 'a'),
        evento('2026-09-22T08:15:00Z', '2026-09-22T09:00:00Z', 'b'),
        evento('2026-09-22T14:00:00Z', '2026-09-22T15:00:00Z', 'suelto'),
      ],
      rango,
    )
    expect(bloques.find((b) => b.entrada.titulo === 'suelto')?.columnas).toBe(1)
  })

  it('deja fuera lo que no tiene franja horaria', () => {
    const bloques = colocar([noticia, todoElDia('2026-09-22T00:00:00Z')], rango)
    expect(bloques).toHaveLength(0)
  })
})

describe('lo que va en la banda de arriba', () => {
  it('recoge noticias y días completos', () => {
    const arriba = sinHora([
      noticia,
      todoElDia('2026-09-22T00:00:00Z'),
      evento('2026-09-22T08:00:00Z', '2026-09-22T09:00:00Z'),
    ])
    expect(arriba.map((e) => e.titulo)).toEqual(['aviso', 'jornada'])
  })
})
