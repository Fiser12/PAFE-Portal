import React from 'react'

import type { CallToActionBlock as CTABlockProps } from '@/payload-types'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import CatalogListClient from './CatalogListClient'

export const CatalogListBlock: React.FC<CTABlockProps> = async ({ links, richText }) => {
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
    <CatalogListClient catalogItems={catalogItems.docs} categories={categories.docs} />
  )
}
