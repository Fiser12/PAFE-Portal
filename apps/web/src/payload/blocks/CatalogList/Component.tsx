import React from 'react'

import type { CallToActionBlock as CTABlockProps } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { CatalogList } from '@/modules/catalog/ui/CatalogList'

export const CatalogListBlock: React.FC<CTABlockProps> = async () => {
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
