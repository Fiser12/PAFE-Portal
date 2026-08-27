import type { RuleCheck } from './errors'

export const MAX_LIVE_RESERVATIONS = 2

export const checkQuota = ({
  liveCount,
  isStaff,
  overrideReason,
}: {
  liveCount: number
  isStaff: boolean
  overrideReason?: string | null
}): RuleCheck => {
  if (liveCount < MAX_LIVE_RESERVATIONS) return { ok: true }
  if (!isStaff) return { ok: false, code: 'cupo-lleno' }
  if (!overrideReason?.trim()) return { ok: false, code: 'justificacion-requerida' }
  return { ok: true }
}
