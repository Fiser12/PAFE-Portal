import { COLLECTION_SLUG_FORMACIONES } from '@/core/collections-slugs'
import { hiddenUnlessStaff, isActiveUserAccess, isStaffAccess } from '@/core/permissions'
import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import type { CollectionConfig } from 'payload'

/**
 * Formación = un curso migrado desde Moodle. Se estructura en unidades
 * (secciones), cada una con su contenido Lexical. Los bloques de fichero,
 * enlace, cuestionario y entrega se añadirán como bloques del editor.
 * Ver docs/lms/LMS_IMPLEMENTATION.md.
 */
export const Formaciones: CollectionConfig = {
  slug: COLLECTION_SLUG_FORMACIONES,
  labels: {
    singular: 'Formación',
    plural: 'Formaciones',
  },
  access: {
    create: isStaffAccess,
    delete: isStaffAccess,
    read: isActiveUserAccess,
    update: isStaffAccess,
  },
  admin: {
    hidden: hiddenUnlessStaff,
    defaultColumns: ['title', 'slug', 'updatedAt'],
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      label: 'Título',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'description',
      label: 'Descripción',
      type: 'textarea',
    },
    {
      name: 'moodleCourseId',
      label: 'ID del curso en Moodle',
      type: 'number',
      admin: { readOnly: true, position: 'sidebar', description: 'Origen de la migración' },
      index: true,
    },
    {
      name: 'sections',
      label: 'Unidades',
      type: 'array',
      labels: { singular: 'Unidad', plural: 'Unidades' },
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'title',
          label: 'Título de la unidad',
          type: 'text',
          required: true,
        },
        {
          name: 'content',
          label: false,
          type: 'richText',
          editor: lexicalEditor({
            features: ({ rootFeatures }) => [
              ...rootFeatures,
              HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
              FixedToolbarFeature(),
              InlineToolbarFeature(),
              HorizontalRuleFeature(),
            ],
          }),
        },
      ],
    },
  ],
  timestamps: true,
}
