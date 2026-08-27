'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import type { Reservation } from '@/payload-types'
import { allowedActions, type ReservationAction } from '../domain/actions'
import { madridDateOf } from '../domain/loan-terms'
import {
  cancelReservation,
  extendReservation,
  pickUpReservation,
  registerReplacementAction,
  reportLoss,
  returnBook,
} from '../actions'
import { ACTION_LABELS } from './reservationLabels'

const RUNNERS: Record<ReservationAction, (id: number) => Promise<void>> = {
  cancelar: cancelReservation,
  recoger: pickUpReservation,
  devolver: returnBook,
  perdida: reportLoss,
  prorrogar: extendReservation,
  reponer: registerReplacementAction,
}

const dayOrUndefined = (value: string | null | undefined) =>
  value ? madridDateOf(new Date(value)) : undefined

interface Props {
  reservation: Reservation
  isStaff: boolean
  isOwner: boolean
  penalized: boolean
  onDone?: () => void
}

export function ReservationActions({ reservation, isStaff, isOwner, penalized, onDone }: Props) {
  const [isPending, startTransition] = useTransition()

  const actions = allowedActions({
    status: reservation.status,
    isStaff,
    isOwner,
    alreadyExtended: Boolean(reservation.extension?.requestedAt),
    alreadyReplaced: Boolean(reservation.loss?.replacedAt),
    penalized,
    todayISO: madridDateOf(new Date()),
    dueISO: dayOrUndefined(reservation.dueDate),
  })

  if (actions.length === 0) return null

  const run = (action: ReservationAction) => {
    startTransition(async () => {
      try {
        await RUNNERS[action](reservation.id)
        onDone?.()
      } catch (error) {
        console.error(`Error en la acción ${action}:`, error)
      }
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action}
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={(e) => {
            e.stopPropagation()
            run(action)
          }}
          className={
            action === 'devolver' || action === 'perdida' || action === 'cancelar'
              ? 'text-destructive hover:bg-destructive/10 hover:text-destructive'
              : undefined
          }
        >
          {ACTION_LABELS[action]}
        </Button>
      ))}
    </div>
  )
}
