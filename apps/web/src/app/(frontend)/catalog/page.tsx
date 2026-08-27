import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { CatalogSearch } from '@/modules/catalog/ui/CatalogSearch'
import { CatalogIntro } from '@/modules/catalog/ui/CatalogIntro'

export default async function CatalogPage() {
  const payload = await getPayload({ config: configPromise })
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
      <CatalogSearch categories={categories.docs} />
    </>
  )
}
