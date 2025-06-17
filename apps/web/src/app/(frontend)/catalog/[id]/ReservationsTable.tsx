import { getPayload } from 'payload'
import { mapReservations } from './mappers'
import { ReturnButton } from './ReturnButton'
import configPromise from '@payload-config'
import { User } from '@/payload-types'

interface Props {
    itemId: number
}

export async function ReservationsTable({ itemId }: Props) {
    const payload = await getPayload({ config: configPromise })
    const reservations = await payload.find({
        collection: 'reservation',
        where: {
            item: { equals: itemId }
        },
        depth: 1,
    })

    const formattedReservations = mapReservations(reservations.docs)

    if (!reservations.docs.length) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-600">No hay reservas activas para este libro</p>
            </div>
        )
    }

    const getUserName = (user: User | string) => {
        if (typeof user === 'string') {
            return user
        }
        return user.name || user.email
    }

    return (
        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Reservas activas</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Usuario
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha de reserva
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {reservations.docs.map((reservation) => (
                            <tr key={reservation.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{getUserName(reservation.user)}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {new Date(reservation.reservationDate).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <ReturnButton reservationId={reservation.id} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
} 