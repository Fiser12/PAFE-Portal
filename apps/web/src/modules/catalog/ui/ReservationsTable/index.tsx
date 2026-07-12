'use client'

import type { Reservation } from '@/payload-types'
import { useUser } from '@/lib/auth/useUser'
import useSWR from 'swr'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getItemReservations, getUserReservations, returnBook } from '../../actions'
import { useReservationsRefresh } from '../../hooks/useReservationsRefresh'

interface Props {
  itemId?: number
}

const fetcher = async (key: [string, number | string]) => {
  const [type, id] = key
  if (type === 'item-reservations') {
    const result = await getItemReservations(id as number)
    return result.docs
  } else if (type === 'user-reservations') {
    const result = await getUserReservations(id as string)
    return result.docs
  }
  return []
}

export function ReservationsTable({ itemId }: Props) {
  const { user } = useUser()
  const router = useRouter()

  const swrKey = itemId
    ? (['item-reservations', itemId] as const)
    : user?.id
      ? (['user-reservations', user.id] as const)
      : null

  const { data: reservations, isLoading } = useSWR(swrKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  })
  // Refresca también la disponibilidad y el estado "ya reservado" del detalle
  const refreshReservations = useReservationsRefresh()

  const title = itemId ? 'Reservas actuales' : 'Mis reservas'

  const handleReturn = async (reservationId: number) => {
    try {
      await returnBook(reservationId)
      refreshReservations()
    } catch (err) {
      console.error('Error al devolver el libro:', err)
    }
  }

  if (isLoading) {
    return (
      <section className="mb-8 w-full">
        <h3 className="mb-3 text-lg font-semibold">{title}</h3>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <p>Cargando reservas...</p>
          </CardContent>
        </Card>
      </section>
    )
  }

  if (!reservations || reservations.length === 0) {
    return (
      <section className="mb-8 w-full">
        <h3 className="mb-3 text-lg font-semibold">{title}</h3>
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              No hay reservas {itemId ? 'para este libro' : 'activas'}
            </p>
          </CardContent>
        </Card>
      </section>
    )
  }

  const getUserEmail = (reservationUser: Reservation['user']) => {
    if (typeof reservationUser === 'object' && reservationUser) return reservationUser.email
    return String(reservationUser)
  }

  const handleCardClick = (reservation: Reservation) => {
    // Solo navegar al libro si no es una vista de itemId específico
    if (!itemId && typeof reservation.item === 'object') {
      router.push(`/catalog/${reservation.item.id}`)
    }
  }

  return (
    <section className="mb-8 w-full">
      <h3 className="mb-3 text-lg font-semibold">{title}</h3>

      <div className="space-y-3">
        {reservations.map((reservation) => (
          <Card
            key={reservation.id}
            className={
              !itemId
                ? 'cursor-pointer transition-shadow hover:shadow-md'
                : undefined
            }
            onClick={() => handleCardClick(reservation)}
          >
            <CardContent className="space-y-3 p-4 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-semibold leading-snug">
                    {itemId ? (
                      getUserEmail(reservation.user)
                    ) : (
                      <Link
                        href={`/catalog/${typeof reservation.item === 'object' ? reservation.item.id : reservation.item}`}
                        className="hover:underline"
                      >
                        {typeof reservation.item === 'object'
                          ? reservation.item.title
                          : 'Cargando...'}
                      </Link>
                    )}
                  </h4>
                  <Badge variant="success">Activa</Badge>
                </div>
                <span className="self-start rounded border bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground sm:self-auto">
                  {new Date(reservation.reservationDate).toLocaleDateString('es-ES')}
                </span>
              </div>

              <div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleReturn(reservation.id)
                  }}
                >
                  Devolver
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
