import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { CatalogSearch } from '@/modules/catalog/ui/CatalogSearch'

export default async function CatalogPage() {
  const payload = await getPayload({ config: configPromise })
  const categories = await payload.find({
    collection: 'taxonomy',
    pagination: false,
  })

  return <CatalogSearch categories={categories.docs} />
}
