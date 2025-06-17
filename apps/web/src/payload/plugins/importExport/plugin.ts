import { COLLECTION_SLUG_USER, COLLECTION_SLUG_CATEGORIES, COLLECTION_SLUG_EXPORTS, COLLECTION_SLUG_MEDIA, COLLECTION_SLUG_PDF, COLLECTION_SLUG_POSTS, COLLECTION_SLUG_PAGES } from "@/core/collections-slugs";
import { importExportPlugin } from "@payloadcms/plugin-import-export";
import { checkRoleHidden } from "@/core/permissions";

export const plugin = importExportPlugin({
    collections: [
        COLLECTION_SLUG_POSTS, 
        COLLECTION_SLUG_PAGES, 
        COLLECTION_SLUG_USER,
        COLLECTION_SLUG_CATEGORIES, 
        COLLECTION_SLUG_MEDIA, 
        COLLECTION_SLUG_PDF, 
        COLLECTION_SLUG_EXPORTS, 
    ],
    overrideExportCollection: (collection) => {
        return {
            ...collection,
            admin: {
                ...collection.admin,
                group: 'System',
                hidden: checkRoleHidden("admin"),
            }
        }
    },
    disableJobsQueue: true,
  
})