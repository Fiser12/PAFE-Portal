import { canRequestExtension } from './loan-terms'
import type { ReservationStatus } from './lifecycle'

export type ReservationAction =
  | 'cancelar'
  | 'recoger'
  | 'devolver'
  | 'perdida'
  | 'prorrogar'
  | 'reponer'

export const allowedActions = ({
  status,
  isStaff,
  isOwner,
  alreadyExtended,
  alreadyReplaced,
  penalized,
  todayISO,
  dueISO,
}: {
  status: ReservationStatus
  isStaff: boolean
  isOwner: boolean
  alreadyExtended: boolean
  alreadyReplaced?: boolean
  penalized: boolean
  todayISO: string
  dueISO?: string
}): ReservationAction[] => {
  const actions: ReservationAction[] = []
  const ownerOrStaff = isOwner || isStaff

  if (status === 'reservada') {
    if (ownerOrStaff) actions.push('cancelar')
    if (isStaff) actions.push('recoger')
  }

  if (status === 'activa') {
    if (isStaff) actions.push('devolver', 'perdida')
    if (
      ownerOrStaff &&
      canRequestExtension({
        status,
        alreadyExtended,
        penalized,
        todayISO,
        dueISO: dueISO ?? todayISO,
      }).ok
    ) {
      actions.push('prorrogar')
    }
  }

  if (status === 'perdida' && isStaff && !alreadyReplaced) actions.push('reponer')

  return actions
}
