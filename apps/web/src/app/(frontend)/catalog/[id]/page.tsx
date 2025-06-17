import configPromise from '@payload-config'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { CatalogItemClient } from '@/modules/catalog/ui/DetailPage'

interface Props {
    params: Promise<{ id: string }>
}

export default async function CatalogItemPage({ params }: Props) {
    const payload = await getPayload({ config: configPromise })
    const catalogItem = await payload.findByID({
        collection: 'catalog-item',
        id: (await params).id,
        depth: 2,
    })

    if (!catalogItem) {
        return notFound()
    }

    return <CatalogItemClient item={catalogItem} >
        <RichText data={catalogItem.content} />
    </CatalogItemClient>
} 