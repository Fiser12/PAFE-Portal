import { describe, expect, it } from 'vitest'
import { diasDelMes } from '@/modules/calendario/domain/mes'
import { mezclar } from '@/modules/calendario/domain/entradas'
import { mesYAnio } from '@/modules/calendario/domain/fechas'

const now = new Date('2026-09-26T12:00:00Z')
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
    const evento = {
      uid: 'uno',
      titulo: 'Reunión',
      inicio: new Date('2026-03-28T23:30:00Z'),
      fin: new Date('2026-03-29T01:00:00Z'),
      diaCompleto: false,
      calendario: 'general',
    }
    expect(mezclar([evento], [], now).cronologia).toHaveLength(0)
    const entradas = mezclar([evento], [], now, 'Europe/Madrid', false).cronologia
    const dias = diasDelMes(entradas, new Date('2026-03-01'), now)
    expect(dias.find(({ entradas }) => entradas.length)?.dia.toISOString()).toContain('2026-03-29')
  })
  it('ofrece los meses en español y euskera', () => {
    expect(mesYAnio(now, 'es')).toBe('septiembre de 2026')
    expect(mesYAnio(now, 'eu')).toBe('2026ko iraila')
  })
})
