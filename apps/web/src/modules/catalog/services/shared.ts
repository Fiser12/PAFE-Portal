import type { Payload, Where } from 'payload'
import type { Reservation, User } from '@/payload-types'
import { LoanRuleError, type LoanRuleCode, type RuleCheck } from '../domain/errors'
import { isPenalized } from '../domain/penalties'
import { madridDateOf } from '../domain/loan-terms'

export type Actor = Pick<User, 'id' | 'email'> & { role?: unknown }

export type ServiceContext = {
  payload: Payload
  user: Actor
  now: Date
}

/** Mediodía UTC: el día de calendario sobrevive a cualquier lectura posterior */
export const dayToInstant = (iso: string): string => `${iso}T12:00:00.000Z`

export const dayOf = (value: string | null | undefined): string | undefined =>
  value ? madridDateOf(new Date(value)) : undefined

export const assert = (check: RuleCheck): void => {
  if (!check.ok) throw new LoanRuleError(check.code)
}

export const fail = (code: LoanRuleCode): never => {
  throw new LoanRuleError(code)
}

export const relationId = (value: number | { id: number } | null | undefined): number =>
  typeof value === 'object' && value !== null ? value.id : (value as number)

/** Reservas que comprometen ejemplar y cupo: una pérdida repuesta ya no cuenta */
export const liveReservationsWhere = (extra: Where): Where => ({
  and: [
    extra,
    {
      or: [
        { status: { in: ['reservada', 'activa'] } },
        {
          and: [{ status: { equals: 'perdida' } }, { 'loss.replacedAt': { exists: false } }],
        },
      ],
    },
  ],
})

export const loadReservation = async (payload: Payload, id: number): Promise<Reservation> =>
  payload.findByID({ collection: 'reservation', id, depth: 0, overrideAccess: true })

export const loadUser = async (payload: Payload, id: number): Promise<User> =>
  payload.findByID({ collection: 'users', id, depth: 0, overrideAccess: true })

export const loadItemTitle = async (payload: Payload, id: number): Promise<string> => {
  const item = await payload.findByID({
    collection: 'catalog-item',
    id,
    depth: 0,
    overrideAccess: true,
  })
  return item.title
}

/**
 * El estado ya está persistido cuando se avisa: un fallo de envío no puede
 * tumbar la operación ni dejar creer al staff que la transición no ocurrió.
 */
export const sendEmailSafely = async (
  payload: Payload,
  message: { to: string; subject: string; text: string; html: string },
): Promise<void> => {
  try {
    await payload.sendEmail(message)
  } catch (error) {
    payload.logger.error(
      `[prestamos] fallo enviando "${message.subject}" a ${message.to}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    )
  }
}

export const isOwnerPenalizedAt = (owner: User, now: Date): boolean =>
  isPenalized({ penalizedUntilISO: dayOf(owner.penalizedUntil), atISO: madridDateOf(now) })
