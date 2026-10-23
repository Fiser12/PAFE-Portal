import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "adjunto" ADD COLUMN "_objectkey" varchar;
  ALTER TABLE "media" ADD COLUMN "_objectkey" varchar;
  ALTER TABLE "files" ADD COLUMN "_objectkey" varchar;
  ALTER TABLE "exports" ADD COLUMN "_objectkey" varchar;
  ALTER TABLE "imports" ADD COLUMN "_objectkey" varchar;
  CREATE INDEX "noticia_locales_parent_id_idx" ON "noticia_locales" USING btree ("_parent_id");
  CREATE INDEX "adjunto_locales_parent_id_idx" ON "adjunto_locales" USING btree ("_parent_id");
  CREATE INDEX "catalog_item_locales_parent_id_idx" ON "catalog_item_locales" USING btree ("_parent_id");
  CREATE INDEX "external_resources_locales_parent_id_idx" ON "external_resources_locales" USING btree ("_parent_id");
  CREATE INDEX "taxonomy_locales_parent_id_idx" ON "taxonomy_locales" USING btree ("_parent_id");
  CREATE INDEX "media_locales_parent_id_idx" ON "media_locales" USING btree ("_parent_id");
  CREATE INDEX "pages_locales_parent_id_idx" ON "pages_locales" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_locales_parent_id_idx" ON "_pages_v_locales" USING btree ("_parent_id");
  CREATE INDEX "posts_locales_parent_id_idx" ON "posts_locales" USING btree ("_parent_id");
  CREATE INDEX "_posts_v_locales_parent_id_idx" ON "_posts_v_locales" USING btree ("_parent_id");
  CREATE INDEX "files_locales_parent_id_idx" ON "files_locales" USING btree ("_parent_id");
  CREATE INDEX "search_locales_parent_id_idx" ON "search_locales" USING btree ("_parent_id");
  CREATE INDEX "presentacion_catalogo_locales_parent_id_idx" ON "presentacion_catalogo_locales" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "noticia_locales_parent_id_idx";
  DROP INDEX "adjunto_locales_parent_id_idx";
  DROP INDEX "catalog_item_locales_parent_id_idx";
  DROP INDEX "external_resources_locales_parent_id_idx";
  DROP INDEX "taxonomy_locales_parent_id_idx";
  DROP INDEX "media_locales_parent_id_idx";
  DROP INDEX "pages_locales_parent_id_idx";
  DROP INDEX "_pages_v_locales_parent_id_idx";
  DROP INDEX "posts_locales_parent_id_idx";
  DROP INDEX "_posts_v_locales_parent_id_idx";
  DROP INDEX "files_locales_parent_id_idx";
  DROP INDEX "search_locales_parent_id_idx";
  DROP INDEX "presentacion_catalogo_locales_parent_id_idx";
  ALTER TABLE "adjunto" DROP COLUMN "_objectkey";
  ALTER TABLE "media" DROP COLUMN "_objectkey";
  ALTER TABLE "files" DROP COLUMN "_objectkey";
  ALTER TABLE "exports" DROP COLUMN "_objectkey";
  ALTER TABLE "imports" DROP COLUMN "_objectkey";`)
}
