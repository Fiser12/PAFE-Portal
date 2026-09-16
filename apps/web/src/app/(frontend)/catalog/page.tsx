import { redirect } from 'next/navigation'
import { isActiveUser } from '@/core/permissions'
import { CatalogSearch } from '@/modules/catalog/ui/CatalogSearch'
import { CatalogIntro } from '@/modules/catalog/ui/CatalogIntro'
import { getSessionUser } from '@/utilities/getSessionUser'

interface Props {
  searchParams: Promise<{ q?: string }>
}

export default async function CatalogPage({ searchParams }: Props) {
  const { q } = await searchParams
  const { payload, user } = await getSessionUser()
  if (!user || !isActiveUser(user)) redirect('/login')

  const categories = await payload.find({
    collection: 'taxonomy',
    pagination: false,
    // Orden de inserción del seed: mantiene los tramos de edad ordenados
    sort: 'id',
  })

  return (
    <>
      <div className="container mx-auto px-4 pt-8">
        <CatalogIntro />
      </div>
      <CatalogSearch categories={categories.docs} initialQuery={q ?? ''} />
    </>
  )
}
