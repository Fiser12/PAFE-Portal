import { describe, expect, it } from 'vitest'
import { aEntradas } from '@/modules/calendario/domain/entradas'
import { diasDelMes, semanasDelMes } from '@/modules/calendario/domain/mes'
import { mesYAnio } from '@/modules/calendario/domain/fechas'
import type { Ocurrencia } from '@/modules/calendario/domain/ocurrencias'

const now = new Date('2026-09-26T12:00:00Z')

const conHora = (inicio: string, fin: string, titulo: string): Ocurrencia => ({
  uid: titulo,
  titulo,
  inicio: new Date(inicio),
  fin: new Date(fin),
  diaCompleto: false,
  calendario: 'general',
})

const jornadas = (desde: string, hastaExclusivo: string, titulo: string): Ocurrencia => ({
  ...conHora(`${desde}T00:00:00Z`, `${hastaExclusivo}T00:00:00Z`, titulo),
  diaCompleto: true,
  calendario: 'otras',
})

describe('calendario mensual', () => {
  it('completa semanas de lunes a domingo, incluyendo los meses contiguos', () => {
    const dias = diasDelMes([], new Date('2026-09-26T00:00:00Z'), now)
    expect(dias).toHaveLength(35)
    expect(dias[0]?.dia.toISOString()).toContain('2026-08-31')
    expect(dias.at(-1)?.dia.toISOString()).toContain('2026-10-04')
    expect(dias.filter((dia) => dia.hoy)).toHaveLength(1)
  })

  it('incluye febrero bisiesto y meses de seis semanas', () => {
    expect(
      diasDelMes([], new Date('2024-02-01')).some(({ dia }) =>
        dia.toISOString().startsWith('2024-02-29'),
      ),
    ).toBe(true)
    expect(diasDelMes([], new Date('2026-03-01'))).toHaveLength(42)
    expect(diasDelMes([], new Date('2027-01-01'))[0]?.dia.toISOString()).toContain('2026-12-28')
  })

  it('conserva eventos pasados al navegar y usa el día de Madrid durante el cambio de hora', () => {
    const entradas = aEntradas([conHora('2026-03-28T23:30:00Z', '2026-03-29T01:00:00Z', 'Reunión')])
    const dias = diasDelMes(entradas, new Date('2026-03-01'), now)
    expect(dias.find(({ entradas }) => entradas.length)?.dia.toISOString()).toContain('2026-03-29')
  })

  it('ofrece los meses en español y euskera', () => {
    expect(mesYAnio(now, 'es')).toBe('septiembre de 2026')
    expect(mesYAnio(now, 'eu')).toBe('2026ko iraila')
  })
})

describe('las barras del mes, como en Google Calendar', () => {
  const septiembre = new Date('2026-09-01T00:00:00Z')
  const semana = (semanas: ReturnType<typeof semanasDelMes>, lunes: string) =>
    semanas.find((s) => s.dias[0]?.dia.toISOString().startsWith(lunes))

  it('parte el mes en semanas de siete días', () => {
    const semanas = semanasDelMes([], septiembre, now)
    expect(semanas).toHaveLength(5)
    expect(semanas.every((s) => s.dias.length === 7)).toBe(true)
  })

  it('una jornada completa es una barra de una casilla', () => {
    const semanas = semanasDelMes(aEntradas([jornadas('2026-09-04', '2026-09-05', 'LAGUNARTE')]), septiembre, now)
    const [barra] = semana(semanas, '2026-08-31')?.barras ?? []
    expect(barra).toMatchObject({ desde: 4, hasta: 4, carril: 0, empiezaAntes: false, acabaDespues: false })
  })

  it('lo que dura varios días es una sola barra que los cruza', () => {
    const semanas = semanasDelMes(aEntradas([jornadas('2026-09-25', '2026-09-28', 'OKENDO')]), septiembre, now)
    const barras = semana(semanas, '2026-09-21')?.barras ?? []
    expect(barras).toHaveLength(1)
    expect(barras[0]).toMatchObject({ desde: 4, hasta: 6, acabaDespues: false })
  })

  it('si cruza de semana, sigue en la siguiente y lo dice', () => {
    const semanas = semanasDelMes(aEntradas([jornadas('2026-09-25', '2026-10-05', 'OKENDO')]), septiembre, now)
    expect(semana(semanas, '2026-09-21')?.barras[0]).toMatchObject({
      desde: 4,
      hasta: 6,
      empiezaAntes: false,
      acabaDespues: true,
    })
    expect(semana(semanas, '2026-09-28')?.barras[0]).toMatchObject({
      desde: 0,
      hasta: 6,
      empiezaAntes: true,
      acabaDespues: false,
    })
  })

  it('las barras que se pisan van en carriles distintos; las que no, comparten', () => {
    const semanas = semanasDelMes(
      aEntradas([
        jornadas('2026-09-21', '2026-09-24', 'larga'),
        jornadas('2026-09-22', '2026-09-23', 'dentro'),
        jornadas('2026-09-25', '2026-09-26', 'después'),
      ]),
      septiembre,
      now,
    )
    const carriles = Object.fromEntries(
      (semana(semanas, '2026-09-21')?.barras ?? []).map((b) => [b.entrada.titulo, b.carril]),
    )
    expect(carriles).toEqual({ larga: 0, dentro: 1, después: 0 })
  })

  it('lo que tiene hora en un solo día no es barra: va en su casilla', () => {
    const semanas = semanasDelMes(
      aEntradas([conHora('2026-09-08T08:00:00Z', '2026-09-08T10:00:00Z', 'REUNION')]),
      septiembre,
      now,
    )
    const lunes7 = semana(semanas, '2026-09-07')
    expect(lunes7?.barras).toEqual([])
    expect(lunes7?.dias[1]?.entradas.map((e) => e.titulo)).toEqual(['REUNION'])
  })

  it('lo que es barra no se repite dentro de las casillas', () => {
    const semanas = semanasDelMes(aEntradas([jornadas('2026-09-25', '2026-09-28', 'OKENDO')]), septiembre, now)
    expect(semana(semanas, '2026-09-21')?.dias.every((d) => d.entradas.length === 0)).toBe(true)
  })

  it('dice cuántos carriles necesita cada semana', () => {
    const semanas = semanasDelMes(
      aEntradas([jornadas('2026-09-21', '2026-09-24', 'a'), jornadas('2026-09-22', '2026-09-23', 'b')]),
      septiembre,
      now,
    )
    expect(semana(semanas, '2026-09-21')?.carriles).toBe(2)
    expect(semana(semanas, '2026-09-07')?.carriles).toBe(0)
  })
})
