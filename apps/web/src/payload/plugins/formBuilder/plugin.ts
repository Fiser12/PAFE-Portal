import { formBuilderPlugin } from "@payloadcms/plugin-form-builder"
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from "@payloadcms/richtext-lexical"
import { hiddenUnlessAdmin, isActiveUserAccess, isStaffAccess } from "@/core/permissions"
import { authenticated } from "@/payload/access/authenticated"
import { COLLECTION_SLUG_FORMS, COLLECTION_SLUG_FORMS_SUBMISSION } from "@/core/collections-slugs"

export const plugin = formBuilderPlugin({
    fields: {
      payment: false,
    },
    formSubmissionOverrides: {
      slug: COLLECTION_SLUG_FORMS_SUBMISSION,
      access: {
        // Solo usuarios con rol pueden enviar cuestionarios
        create: isActiveUserAccess,
        delete: isStaffAccess,
        read: isStaffAccess,
        update: isStaffAccess,
      },
      admin: { hidden: hiddenUnlessAdmin },
    },
    formOverrides: {
      slug: COLLECTION_SLUG_FORMS,
      access: {
        create: isStaffAccess,
        delete: isStaffAccess,
        read: authenticated,
        update: isStaffAccess,
      },
      admin: {
        hidden: hiddenUnlessAdmin,
      },
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
  })