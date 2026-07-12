import { COLLECTION_SLUG_USER, COLLECTION_SLUG_CATEGORIES, COLLECTION_SLUG_EXPORTS, COLLECTION_SLUG_MEDIA, COLLECTION_SLUG_FILES, COLLECTION_SLUG_POSTS, COLLECTION_SLUG_PAGES } from "@/core/collections-slugs";
import { importExportPlugin } from "@payloadcms/plugin-import-export";
import { hiddenUnlessAdmin } from "@/core/permissions";

export const plugin = importExportPlugin({
    collections: [
        COLLECTION_SLUG_POSTS,
        COLLECTION_SLUG_PAGES,
        COLLECTION_SLUG_USER,
        COLLECTION_SLUG_CATEGORIES,
        COLLECTION_SLUG_MEDIA,
        COLLECTION_SLUG_FILES,
        COLLECTION_SLUG_EXPORTS,
    ].map((slug) => ({ slug })),
    overrideExportCollection: ({ collection }) => {
        return {
            ...collection,
            admin: {
                ...collection.admin,
                group: 'System',
                hidden: hiddenUnlessAdmin,
            }
        }
    },  
})