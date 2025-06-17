import { checkRole } from '@/core/permissions'
import { CatalogItem } from '@/payload-types'
import configPromise from '@payload-config'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import { getPayloadSession } from 'payload-authjs'
import { ReservationForm } from './ReservationForm'
import { ReservationsTable } from './ReservationsTable'

interface Props {
    params: Promise<{ id: string }>
}

export default async function CatalogItemPage({ params }: Props) {
    const payload = await getPayload({ config: configPromise })
    const session = await getPayloadSession()
    const catalogItem = await payload.findByID({
        collection: 'catalog-item',
        id: (await params).id,
        depth: 2,
    })

    if (!catalogItem) {
        return notFound()
    }

    const item = catalogItem as CatalogItem
    const isCatalogAdmin = session?.user ? checkRole({ roleSlug: 'catalog-admin', user: session.user }) : false

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div>
                        {item.cover && typeof item.cover !== 'number' && (
                            <img
                                src={item.cover.url ?? undefined}
                                alt={item.title}
                                className="w-full h-auto rounded-lg shadow-md"
                                style={{ maxWidth: '400px' }}
                            />
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold mb-4">{item.title}</h1>
                        <div className="prose max-w-none mb-6">
                            <RichText data={item.content} />
                        </div>
                        <div className="mb-4">
                            <p className="text-lg">
                                <span className="font-semibold">Disponibles:</span> {item.quantity || 0}
                            </p>
                        </div>
                        <ReservationForm itemId={item.id} />
                    </div>
                </div>
                { isCatalogAdmin && <ReservationsTable itemId={item.id} /> }
            </div>
        </div>
    )
} 