import type { GlobalConfig } from 'payload'
import { catalogoAccess, hiddenUnlessCatalogo } from '@/core/permissions'
import { TEXTO_INICIAL, TEXTO_INICIAL_EU } from './textoInicial'

export const GLOBAL_SLUG_PRESENTACION = 'presentacion-catalogo'

/**
 * El texto que abre el catálogo. Lo edita quien lleva el catálogo, sin pasar
 * por quien administra el sitio.
 */
export const PresentacionCatalogo: GlobalConfig = {
  slug: GLOBAL_SLUG_PRESENTACION,
  label: 'Presentación del catálogo',
  access: {
    read: () => true,
    update: catalogoAccess,
  },
  admin: {
    group: 'Catálogo',
    hidden: hiddenUnlessCatalogo,
  },
  fields: [
    {
      label: 'Texto',
      name: 'texto',
      type: 'richText',
      localized: true,
      defaultValue: ({ locale }: { locale?: string }) =>
        locale === 'eu' ? TEXTO_INICIAL_EU : TEXTO_INICIAL,
      admin: {
        description: 'Lo que lee quien entra al catálogo, encima de la búsqueda',
      },
    },
  ],
}
