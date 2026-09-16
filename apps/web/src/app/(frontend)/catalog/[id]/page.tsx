import { notFound, redirect } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import { isActiveUser } from '@/core/permissions'
import { CatalogItemClient } from '@/modules/catalog/ui/DetailPage'
import { fichaDeLaWiki } from '@/modules/catalog/domain/wikiFichas'
import { getIdioma } from '@/utilities/getIdioma'
import { getSessionUser } from '@/utilities/getSessionUser'

interface Props {
    params: Promise<{ id: string }>
}

export default async function CatalogItemPage({ params }: Props) {
    const { payload, user } = await getSessionUser()
    if (!user || !isActiveUser(user)) redirect('/login')

    const catalogItem = await payload.findByID({
        collection: 'catalog-item',
        id: (await params).id,
        depth: 2,
        locale: await getIdioma(),
    })

    if (!catalogItem) {
        return notFound()
    }

    return <CatalogItemClient
        item={catalogItem}
        wikiPath={fichaDeLaWiki(catalogItem.title)}
        contributions={
            catalogItem.contributions ? <RichText data={catalogItem.contributions} /> : null
        }
    >
        {catalogItem.content ? <RichText data={catalogItem.content} /> : null}
    </CatalogItemClient>
} 