import type { CollectionConfig } from 'payload'
import { COLLECTION_SLUG_USER } from '@/core/collections-slugs'
import { authenticated } from '@/payload/access/authenticated'
import { buildTaxonomyRelationship, taxonomyRelationship } from '@nexo-labs/payload-taxonomies'

export const Users: CollectionConfig = {
  slug: COLLECTION_SLUG_USER,
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    buildTaxonomyRelationship({
      label: 'Roles',
      name: 'roles',
      filterOptions: () => {
        return {
          'payload.types': { in: ['role'] },
        }
      },
      defaultValue: [],
    }),
  ],
  timestamps: true,
}
