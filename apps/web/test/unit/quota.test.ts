import { describe, expect, it } from 'vitest'
import { MAX_LIVE_RESERVATIONS, checkQuota } from '@/modules/catalog/domain/quota'

describe('checkQuota — R5: cupo de 2 materiales por familia', () => {
  it('el cupo es 2', () => {
    expect(MAX_LIVE_RESERVATIONS).toBe(2)
  })

  it('permite con 0 y 1 reservas vivas', () => {
    expect(checkQuota({ liveCount: 0, isStaff: false })).toEqual({ ok: true })
    expect(checkQuota({ liveCount: 1, isStaff: false })).toEqual({ ok: true })
  })

  it('una familia con 2 vivas no puede más: cupo-lleno', () => {
    expect(checkQuota({ liveCount: 2, isStaff: false })).toEqual({
      ok: false,
      code: 'cupo-lleno',
    })
  })

  it('la justificación no habilita a una familia', () => {
    expect(
      checkQuota({ liveCount: 2, isStaff: false, overrideReason: 'porque sí' }),
    ).toEqual({ ok: false, code: 'cupo-lleno' })
  })

  it('el staff sin justificación tampoco: justificacion-requerida', () => {
    expect(checkQuota({ liveCount: 2, isStaff: true })).toEqual({
      ok: false,
      code: 'justificacion-requerida',
    })
  })

  it('una justificación en blanco no vale', () => {
    expect(checkQuota({ liveCount: 2, isStaff: true, overrideReason: '   ' })).toEqual({
      ok: false,
      code: 'justificacion-requerida',
    })
  })

  it('el staff con justificación escrita puede exceder el cupo', () => {
    expect(
      checkQuota({
        liveCount: 2,
        isStaff: true,
        overrideReason: 'Material extra para el caso 12, acordado en reunión',
      }),
    ).toEqual({ ok: true })
  })
})
