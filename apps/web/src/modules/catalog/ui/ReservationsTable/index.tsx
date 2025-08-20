'use client'

import type { Reservation } from '@/payload-types'
import { usePayloadSession } from 'payload-authjs/client'
import useSWR from 'swr'
import { getItemReservations, getUserReservations, returnBook } from '../../actions'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  CircularProgress
} from '@mui/material'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
    const { session } = usePayloadSession()
    const user = session?.user
    const router = useRouter()

    const swrKey = itemId 
        ? ['item-reservations', itemId] as const
        : user?.id 
            ? ['user-reservations', user.id] as const
            : null

    const { data: reservations, mutate, isLoading, error } = useSWR(
        swrKey,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: true,
        }
    )

    const handleReturn = async (reservationId: number) => {
        try {
            await returnBook(reservationId)
            // Revalidar los datos automáticamente
            mutate()
        } catch (err) {
            console.error('Error al devolver el libro:', err)
        }
    }

    if (isLoading) {
        return (
            <Card sx={{ maxWidth: '100%', mx: 'auto', mb: 4 }}>
                <CardContent>
                    <Typography variant="h6" component="h3" gutterBottom>
                        {itemId ? 'Reservas actuales' : 'Mis reservas'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CircularProgress size={20} />
                        <Typography>Cargando reservas...</Typography>
                    </Box>
                </CardContent>
            </Card>
        )
    }

    if (!reservations || reservations.length === 0) {
        return (
            <Box sx={{ width: '100%', mb: 4 }}>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                        {itemId ? 'Reservas actuales' : 'Mis reservas'}
                    </Typography>
                </Box>
                <Card sx={{ 
                    borderRadius: 3,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                    overflow: 'hidden'
                }}>
                    <CardContent sx={{ p: 3, textAlign: 'center' }}>
                        <Typography color="text.secondary" variant="body1">
                            No hay reservas {itemId ? 'para este libro' : 'activas'}
                        </Typography>
                    </CardContent>
                </Card>
            </Box>
        )
    }

    const getUserEmail = (user: any) => {
        if (typeof user === 'string') return user
        return user.email
    }

    const handleCardClick = (reservation: Reservation) => {
        // Solo navegar al libro si no es una vista de itemId específico
        if (!itemId && typeof reservation.item === 'object') {
            router.push(`/catalog/${reservation.item.id}`)
        }
    }

    return (
        <Box sx={{ width: '100%', mb: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                    {itemId ? 'Reservas actuales' : 'Mis reservas'}
                </Typography>
            </Box>

            {/* Reservations List - Apple insetGrouped style */}
            <Box sx={{ mb: 3 }}>
                {reservations.map((reservation) => (
                    <Card 
                        key={reservation.id}
                        sx={{ 
                            mb: 2,
                            borderRadius: 3,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                            overflow: 'hidden',
                            cursor: !itemId ? 'pointer' : 'default',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.15)',
                            },
                            '&:active': {
                                transform: 'translateY(0px)',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
                            }
                        }}
                        onClick={() => handleCardClick(reservation)}
                    >
                        <CardContent sx={{ p: 3 }}>
                            {/* Header row */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    {!itemId && (
                                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                                            <Link
                                                href={`/catalog/${typeof reservation.item === 'object' ? reservation.item.id : reservation.item}`}
                                                style={{ textDecoration: 'none', color: 'inherit' }}
                                            >
                                                {typeof reservation.item === 'object' ? reservation.item.title : 'Cargando...'}
                                            </Link>
                                        </Typography>
                                    )}
                                    {itemId && (
                                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                                            {getUserEmail(reservation.user)}
                                        </Typography>
                                    )}
                                    <Chip
                                        label="Activa"
                                        size="small"
                                        sx={{ 
                                            backgroundColor: 'success.main',
                                            color: 'success.contrastText',
                                            fontSize: '0.7rem',
                                            height: 24
                                        }}
                                    />
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ 
                                    fontFamily: 'monospace',
                                    backgroundColor: 'background.paper',
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 1,
                                    border: '1px solid',
                                    borderColor: 'divider'
                                }}>
                                    {new Date(reservation.reservationDate).toLocaleDateString()}
                                </Typography>
                            </Box>

                            {/* Actions */}
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleReturn(reservation.id)
                                    }}
                                    sx={{
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        fontWeight: 500
                                    }}
                                >
                                    Devolver
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                ))}
            </Box>
        </Box>
    )
} 