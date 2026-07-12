import { searchPlugin } from '@payloadcms/plugin-search'
import { searchFields } from './fieldOverrides'
import { beforeSyncWithSearch } from './beforeSync'
import { hiddenUnlessAdmin, isActiveUserAccess } from '@/core/permissions'
import { COLLECTION_SLUG_CATALOG_ITEM } from '@/modules/catalog/collections/CatalogItem'
import { COLLECTION_SLUG_FILES, COLLECTION_SLUG_EXTERNAL_RESOURCES } from '@/core/collections-slugs'

// El índice de búsqueda es el "catálogo global": reservables + descargables + recursos externos
export const plugin = searchPlugin({
  collections: [
    COLLECTION_SLUG_CATALOG_ITEM,
    COLLECTION_SLUG_FILES,
    COLLECTION_SLUG_EXTERNAL_RESOURCES,
  ],
  beforeSync: beforeSyncWithSearch,
  searchOverrides: {
    access: {
      // El índice incluye materiales digitales (solo para usuarios con rol),
      // así que la búsqueda global exige rol
      read: isActiveUserAccess,
    },
    admin: {
      hidden: hiddenUnlessAdmin,
    },
    fields: ({ defaultFields }) => {
      return [...defaultFields, ...searchFields]
    },
  },
})
