import { getPayload } from 'payload'
import { ReservationButton } from './ReservationButton'
import configPromise from '@payload-config'
import { getPayloadSession } from "payload-authjs";

interface Props {
    itemId: number
}

export async function ReservationForm({ itemId }: Props) {
    const session = await getPayloadSession();
    const payload = await getPayload({ config: configPromise })

    if (!session?.user?.id) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800">
                    Debes iniciar sesión para poder reservar este libro
                </p>
            </div>
        )
    }

    const existingReservation = await payload.find({
        collection: 'reservation',
        where: {
            and: [
                { item: { equals: itemId } },
                { user: { equals: session.user.id } }
            ],
        },
    })

    const hasReservation = existingReservation.totalDocs > 0
    const reservation = hasReservation ? existingReservation.docs[0] : null

    return (
        <div>
            {hasReservation ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800">
                        Ya tienes una reserva de este libro desde el{' '}
                        {new Date(reservation?.reservationDate ?? '').toLocaleDateString()}
                    </p>
                </div>
            ) : (
                <ReservationButton itemId={itemId} userId={session.user.id} />
            )}
        </div>
    )
} 