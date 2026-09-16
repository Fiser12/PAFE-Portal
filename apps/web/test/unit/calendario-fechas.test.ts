import { describe, expect, it } from 'vitest'
import { diaCorto, diaLargo } from '@/modules/calendario/domain/fechas'

// Jueves 17 de septiembre de 2026
const jueves = new Date('2026-09-17T00:00:00Z')

describe('las fechas en euskera', () => {
  it('escribe el día y el mes en euskera', () => {
    expect(diaLargo(jueves, 'eu')).toBe('osteguna, irailak 17')
  })

  it('no se apoya en Intl para el euskera, que devuelve castellano', () => {
    // Si algún día un navegador trajera datos de euskera esto seguiría valiendo,
    // pero hoy `new Intl.DateTimeFormat('eu-ES')` resuelve a es-ES sin avisar.
    expect(diaLargo(jueves, 'eu')).not.toContain('jueves')
    expect(diaLargo(jueves, 'eu')).not.toContain('septiembre')
  })

  it('en castellano sigue usando el formato del sistema', () => {
    expect(diaLargo(jueves, 'es')).toContain('jueves')
    expect(diaLargo(jueves, 'es')).toContain('septiembre')
  })

  it('abrevia el día para la rejilla semanal', () => {
    expect(diaCorto(jueves, 'eu')).toBe('og. 17')
    expect(diaCorto(jueves, 'es')).toContain('17')
  })

  it('cubre los siete días y los doce meses', () => {
    for (let i = 0; i < 7; i++) {
      const dia = new Date(Date.UTC(2026, 8, 13 + i))
      expect(diaLargo(dia, 'eu')).not.toContain('undefined')
    }
    for (let m = 0; m < 12; m++) {
      const dia = new Date(Date.UTC(2026, m, 15))
      expect(diaLargo(dia, 'eu')).not.toContain('undefined')
    }
  })
})
