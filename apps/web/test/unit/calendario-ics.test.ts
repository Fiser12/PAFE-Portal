import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { leerCalendario } from '@/modules/calendario/domain/ics'

const ics = readFileSync(join(__dirname, '../fixtures/calendario.ics'), 'utf8')

describe('leer un calendario .ics', () => {
  const calendario = leerCalendario(ics, 'reuniones')

  it('toma el nombre que el calendario declara', () => {
    expect(calendario.nombre).toBe('REUNIONES MARTES')
  })

  it('no confunde los bloques de zona horaria con eventos', () => {
    // VTIMEZONE trae sus propios RRULE: si se colaran, saldrían eventos
    // fantasma cada último domingo de marzo y de octubre.
    expect(calendario.eventos.map((e) => e.uid)).not.toContain(undefined)
    expect(calendario.eventos).toHaveLength(5)
  })

  it('deshace el plegado de líneas largas', () => {
    const formacion = calendario.eventos.find((e) => e.uid === 'evento-utc@google.com')
    expect(formacion?.descripcion).toContain('y tarde hasta las 5')
  })

  it('deshace los escapes del formato', () => {
    const formacion = calendario.eventos.find((e) => e.uid === 'evento-utc@google.com')
    expect(formacion?.descripcion).toContain('Pausa de 1:30 a 3, y tarde')
  })

  it('lee una fecha en UTC tal cual', () => {
    const formacion = calendario.eventos.find((e) => e.uid === 'evento-utc@google.com')
    expect(formacion?.inicio.toISOString()).toBe('2025-10-20T07:30:00.000Z')
  })

  it('convierte la hora de Madrid a su instante real, con horario de verano', () => {
    const reunion = calendario.eventos.find((e) => e.rrule)
    // 22 de septiembre: Madrid va en UTC+2
    expect(reunion?.inicio.toISOString()).toBe('2026-09-22T08:00:00.000Z')
  })

  it('marca los eventos de día completo', () => {
    const jornada = calendario.eventos.find((e) => e.uid === 'jornada-completa@google.com')
    expect(jornada?.diaCompleto).toBe(true)
  })

  it('recoge la regla de repetición y sus excepciones', () => {
    const reunion = calendario.eventos.find((e) => e.uid === 'reunion-semanal@google.com' && e.rrule)
    expect(reunion?.rrule).toContain('FREQ=MONTHLY')
    expect(reunion?.excepciones).toHaveLength(1)
  })

  it('distingue la instancia cambiada de su serie', () => {
    const cambiada = calendario.eventos.find((e) => e.recurrenciaDe)
    expect(cambiada?.titulo).toContain('cambiada de hora')
    expect(cambiada?.recurrenciaDe?.toISOString()).toBe('2026-10-20T08:00:00.000Z')
  })

  it('conserva el estado para poder descartar lo anulado', () => {
    const anulada = calendario.eventos.find((e) => e.uid === 'cancelado@google.com')
    expect(anulada?.cancelado).toBe(true)
  })
})
