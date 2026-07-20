import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_catalog_item_language" AS ENUM('castellano', 'euskera', 'bilingue');
  ALTER TABLE "catalog_item" ALTER COLUMN "content" DROP NOT NULL;
  ALTER TABLE "catalog_item" ADD COLUMN "author" varchar;
  ALTER TABLE "catalog_item" ADD COLUMN "language" "enum_catalog_item_language";
  ALTER TABLE "catalog_item" ADD COLUMN "loan_days" numeric;
  ALTER TABLE "external_resources" ADD COLUMN "duration" numeric;
  ALTER TABLE "imports" ADD COLUMN "prefix" varchar DEFAULT 'imports';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "catalog_item" ALTER COLUMN "content" SET NOT NULL;
  ALTER TABLE "catalog_item" DROP COLUMN "author";
  ALTER TABLE "catalog_item" DROP COLUMN "language";
  ALTER TABLE "catalog_item" DROP COLUMN "loan_days";
  ALTER TABLE "external_resources" DROP COLUMN "duration";
  ALTER TABLE "imports" DROP COLUMN "prefix";
  DROP TYPE "public"."enum_catalog_item_language";`)
}
