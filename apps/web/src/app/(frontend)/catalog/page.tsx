import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { CatalogSearch } from '@/modules/catalog/ui/CatalogSearch'

export default async function CatalogPage() {
  const payload = await getPayload({ config: configPromise })
  const categories = await payload.find({
    collection: 'taxonomy',
    pagination: false,
    // Orden de inserción del seed: mantiene los tramos de edad ordenados
    sort: 'id',
  })

  return <CatalogSearch categories={categories.docs} />
}
