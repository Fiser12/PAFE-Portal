import { COLLECTION_SLUG_USER, COLLECTION_SLUG_CASES } from '@/core/collections-slugs'
import { authenticated } from '@/payload/access/authenticated'
import { buildTaxonomyRelationship } from '@nexo-labs/payload-taxonomies'
import type { CollectionConfig } from 'payload'
import { COLLECTION_SLUG_RESERVATION } from '../../../modules/catalog/collections/Reservation'
import { checkRoleHidden } from '@/core/permissions'

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
    hidden: checkRoleHidden("admin"),
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'reservations',
      type: 'relationship',
      relationTo: COLLECTION_SLUG_RESERVATION,
      hasMany: true,
    },
    {
      label: 'Casos Asignados',
      name: 'assignedCases',
      type: 'relationship',
      relationTo: COLLECTION_SLUG_CASES,
      hasMany: true,
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
