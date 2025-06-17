import type { GlobalConfig } from 'payload'
import { link } from '@/payload/fields/link'
import { revalidateFooter } from './hooks/revalidateFooter'
import { checkRoleHidden } from '@/core/permissions'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
  },
  admin: {
    hidden: checkRoleHidden("admin"),
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/payload/admin_components/Footer/RowLabel#RowLabel',
        },
      },
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}
