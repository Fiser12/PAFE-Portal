import type { CollectionConfig } from 'payload'
import { COLLECTION_SLUG_NOTICIA, COLLECTION_SLUG_USER } from '@/core/collections-slugs'
import {
  hiddenUnlessTablon,
  tablonAccess,
  isActiveUserAccess,
  isAdminAccess,
  } from '@/core/permissions'
import { lexicalDelTablon } from '../../ui/lexicalDelTablon'
import { AREAS_DEL_TABLON } from '../../domain/areas'
import { avisarAlPublicar } from './hooks/avisarAlPublicar'
import { borrarSusRespuestas } from './hooks/borrarSusRespuestas'

/**
 * Entradas del tablón, que sustituye al foro. Se mantiene la estructura de
 * áreas: cada noticia pertenece a una, y son las áreas las que la gente sigue.
 */
export const Noticia: CollectionConfig = {
  slug: COLLECTION_SLUG_NOTICIA,
  labels: {
    singular: 'Noticia',
    plural: 'Tablón de noticias',
  },
  access: {
    create: tablonAccess,
    delete: isAdminAccess,
    // Mismo criterio que el catálogo: sin rol no se ve nada
    read: isActiveUserAccess,
    update: tablonAccess,
  },
  hooks: {
    // El aviso se dispara aquí y no en el servicio: el staff publica desde el
    // panel, y por ahí no pasa ninguna función nuestra
    afterChange: [avisarAlPublicar],
    beforeDelete: [borrarSusRespuestas],
  },
  admin: {
    group: 'Tablón',
    hidden: hiddenUnlessTablon,
    defaultColumns: ['title', 'area', 'publishedAt', 'pinned'],
    useAsTitle: 'title',
  },
  fields: [
    {
      label: 'Título',
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      label: 'Área',
      name: 'area',
      type: 'select',
      options: [...AREAS_DEL_TABLON],
      required: true,
      index: true,
    },
    {
      label: 'Contenido',
      name: 'body',
      type: 'richText',
      // Editor propio: el del resto del portal no deja incrustar adjuntos
      editor: lexicalDelTablon,
    },
    {
      label: 'Publicada el',
      name: 'publishedAt',
      type: 'date',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Con una fecha futura, la noticia no se muestra ni avisa hasta que llega',
      },
    },
    {
      label: 'Fijada',
      name: 'pinned',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Las fijadas salen arriba del tablón',
      },
    },
    {
      label: 'Autoría',
      name: 'author',
      type: 'relationship',
      relationTo: COLLECTION_SLUG_USER,
      hasMany: false,
    },
    {
      label: 'Avisada el',
      name: 'notifiedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Se avisa una sola vez; editar la noticia no vuelve a avisar',
      },
    },
  ],
  timestamps: true,
}
