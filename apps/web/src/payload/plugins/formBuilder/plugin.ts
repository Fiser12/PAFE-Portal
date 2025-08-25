import { formBuilderPlugin } from "@payloadcms/plugin-form-builder"
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from "@payloadcms/richtext-lexical"
import { checkRoleHidden } from "@/core/permissions"
import { COLLECTION_SLUG_FORMS, COLLECTION_SLUG_FORMS_SUBMISSION } from "@/core/collections-slugs"

export const plugin = formBuilderPlugin({
    fields: {
      payment: false,
    },
    formSubmissionOverrides: {
      slug: COLLECTION_SLUG_FORMS_SUBMISSION,
      admin: { hidden: checkRoleHidden("admin"),  }
    },
    formOverrides: {
      slug: COLLECTION_SLUG_FORMS,
      admin: {
        hidden: checkRoleHidden("admin"),
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