import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { leerCalendario } from '@/modules/calendario/domain/ics'
import { ocurrenciasEntre } from '@/modules/calendario/domain/ocurrencias'

const calendario = leerCalendario(
  readFileSync(join(__dirname, '../fixtures/calendario.ics'), 'utf8'),
  'reuniones',
)

const entre = (desde: string, hasta: string) =>
  ocurrenciasEntre(calendario.eventos, new Date(desde), new Date(hasta))

describe('desplegar las repeticiones', () => {
  it('un evento suelto aparece una vez', () => {
    const octubre2025 = entre('2025-10-01', '2025-11-01')
    expect(octubre2025.filter((o) => o.uid === 'evento-utc@google.com')).toHaveLength(1)
  })

  it('deja fuera lo que cae de rango', () => {
    expect(entre('2026-01-01', '2026-02-01')).toHaveLength(0)
  })

  it('una serie mensual sale una vez al mes', () => {
    // Tercer martes de cada mes hasta fin de 2026: octubre (20), noviembre (17)
    // y diciembre (15). Noviembre está marcado como excepción y octubre viene
    // retocado, así que de la serie limpia solo queda diciembre.
    const serie = entre('2026-09-01', '2027-01-01').filter(
      (o) => o.uid === 'reunion-semanal@google.com',
    )
    expect(serie.map((o) => o.inicio.toISOString().slice(0, 10))).toEqual([
      '2026-10-20',
      '2026-12-15',
    ])
  })

  it('se salta los días marcados como excepción', () => {
    const noviembre = entre('2026-11-01', '2026-12-01').filter(
      (o) => o.uid === 'reunion-semanal@google.com',
    )
    expect(noviembre).toHaveLength(0)
  })

  it('la instancia cambiada sustituye a la de la serie, no se suma', () => {
    const octubre = entre('2026-10-01', '2026-11-01').filter(
      (o) => o.uid === 'reunion-semanal@google.com',
    )
    expect(octubre).toHaveLength(1)
    expect(octubre[0]?.titulo).toContain('cambiada de hora')
    expect(octubre[0]?.inicio.toISOString()).toBe('2026-10-20T15:00:00.000Z')
  })

  it('lo anulado no aparece', () => {
    const julio = entre('2026-07-01', '2026-08-01')
    expect(julio.map((o) => o.uid)).not.toContain('cancelado@google.com')
  })

  it('devuelve las ocurrencias ordenadas por fecha', () => {
    const todo = entre('2025-01-01', '2027-01-01')
    const fechas = todo.map((o) => o.inicio.getTime())
    expect(fechas).toEqual([...fechas].sort((a, b) => a - b))
  })

  it('una serie no se desboca si el rango es enorme', () => {
    const todo = entre('2020-01-01', '2030-01-01')
    expect(todo.length).toBeLessThan(500)
  })
})
