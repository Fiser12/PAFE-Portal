import { searchPlugin } from '@payloadcms/plugin-search'
import { searchFields } from './fieldOverrides'
import { beforeSyncWithSearch } from './beforeSync'
import { checkRoleHidden } from '@/core/permissions'

export const plugin = searchPlugin({
  collections: ['posts'],
  beforeSync: beforeSyncWithSearch,
  searchOverrides: {
    admin: {
      hidden: checkRoleHidden("admin"),
    },
    fields: ({ defaultFields }) => {
      return [...defaultFields, ...searchFields]
    },
  },
})
