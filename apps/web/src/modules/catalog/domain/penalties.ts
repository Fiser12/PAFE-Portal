import { addMonths } from './loan-terms'

export const LATE_RETURNS_BEFORE_PENALTY = 3
export const PENALTY_MONTHS = 6

export const registerLateReturn = ({
  lateCount,
  returnedAtISO,
}: {
  lateCount: number
  returnedAtISO: string
}): { lateCount: number; penalizedUntilISO?: string } => {
  const next = lateCount + 1
  if (next < LATE_RETURNS_BEFORE_PENALTY) return { lateCount: next }
  return { lateCount: next, penalizedUntilISO: addMonths(returnedAtISO, PENALTY_MONTHS) }
}

export const isPenalized = ({
  penalizedUntilISO,
  atISO,
}: {
  penalizedUntilISO?: string | null
  atISO: string
}): boolean => Boolean(penalizedUntilISO && atISO < penalizedUntilISO)
