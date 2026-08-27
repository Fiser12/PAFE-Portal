import { describe, expect, it } from 'vitest'
import { isPenalized, registerLateReturn } from '@/modules/catalog/domain/penalties'

describe('registerLateReturn — R9: contador y activación de la penalización', () => {
  it('1ª y 2ª tardía: suma sin penalizar', () => {
    expect(registerLateReturn({ lateCount: 0, returnedAtISO: '2026-10-06' })).toEqual({
      lateCount: 1,
    })
    expect(registerLateReturn({ lateCount: 1, returnedAtISO: '2026-11-10' })).toEqual({
      lateCount: 2,
    })
  })

  it('3ª tardía: penaliza 6 meses desde esa devolución', () => {
    expect(registerLateReturn({ lateCount: 2, returnedAtISO: '2026-12-15' })).toEqual({
      lateCount: 3,
      penalizedUntilISO: '2027-06-15',
    })
  })

  it('4ª tardía y siguientes: renuevan la penalización desde la nueva devolución', () => {
    expect(registerLateReturn({ lateCount: 3, returnedAtISO: '2027-01-05' })).toEqual({
      lateCount: 4,
      penalizedUntilISO: '2027-07-05',
    })
  })

  it('los +6 meses ajustan al fin de mes cuando el día no existe', () => {
    expect(registerLateReturn({ lateCount: 2, returnedAtISO: '2026-08-31' })).toEqual({
      lateCount: 3,
      penalizedUntilISO: '2027-02-28',
    })
  })
})

describe('isPenalized — vigencia de la penalización', () => {
  it('activa mientras no llega la fecha (fin exclusivo)', () => {
    expect(isPenalized({ penalizedUntilISO: '2026-09-01', atISO: '2026-08-31' })).toBe(true)
    expect(isPenalized({ penalizedUntilISO: '2026-09-01', atISO: '2026-09-01' })).toBe(false)
    expect(isPenalized({ penalizedUntilISO: '2026-09-01', atISO: '2026-09-02' })).toBe(false)
  })

  it('sin fecha no hay penalización', () => {
    expect(isPenalized({ penalizedUntilISO: null, atISO: '2026-08-31' })).toBe(false)
    expect(isPenalized({ penalizedUntilISO: undefined, atISO: '2026-08-31' })).toBe(false)
  })
})
