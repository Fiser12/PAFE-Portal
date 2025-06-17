import { CatalogList } from "@/modules/catalog/ui/CatalogList"
import { getPayload } from "payload"
import configPromise from "@payload-config"


export default async function CatalogPage() {
    const payload = await getPayload({ config: configPromise })
    const catalogItems = await payload.find({
      collection: 'catalog-item',
    })
    const categories = await payload.find({
      collection: 'taxonomy',
      where: { 'payload.types': { in: ['topic'] } },
      pagination: false
    })
    return (
      <CatalogList catalogItems={catalogItems.docs} categories={categories.docs} />
    )
  }