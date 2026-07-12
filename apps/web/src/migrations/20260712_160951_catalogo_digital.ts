import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_external_resources_type" ADD VALUE 'video' BEFORE 'web_link';
  CREATE TABLE "external_resources_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"taxonomy_id" integer
  );
  
  CREATE TABLE "files_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"taxonomy_id" integer
  );
  
  ALTER TABLE "external_resources" ADD COLUMN "cover_id" integer;
  ALTER TABLE "files" ADD COLUMN "cover_id" integer;
  ALTER TABLE "search_rels" ADD COLUMN "files_id" integer;
  ALTER TABLE "search_rels" ADD COLUMN "external_resources_id" integer;
  ALTER TABLE "external_resources_rels" ADD CONSTRAINT "external_resources_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."external_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "external_resources_rels" ADD CONSTRAINT "external_resources_rels_taxonomy_fk" FOREIGN KEY ("taxonomy_id") REFERENCES "public"."taxonomy"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "files_rels" ADD CONSTRAINT "files_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "files_rels" ADD CONSTRAINT "files_rels_taxonomy_fk" FOREIGN KEY ("taxonomy_id") REFERENCES "public"."taxonomy"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "external_resources_rels_order_idx" ON "external_resources_rels" USING btree ("order");
  CREATE INDEX "external_resources_rels_parent_idx" ON "external_resources_rels" USING btree ("parent_id");
  CREATE INDEX "external_resources_rels_path_idx" ON "external_resources_rels" USING btree ("path");
  CREATE INDEX "external_resources_rels_taxonomy_id_idx" ON "external_resources_rels" USING btree ("taxonomy_id");
  CREATE INDEX "files_rels_order_idx" ON "files_rels" USING btree ("order");
  CREATE INDEX "files_rels_parent_idx" ON "files_rels" USING btree ("parent_id");
  CREATE INDEX "files_rels_path_idx" ON "files_rels" USING btree ("path");
  CREATE INDEX "files_rels_taxonomy_id_idx" ON "files_rels" USING btree ("taxonomy_id");
  ALTER TABLE "external_resources" ADD CONSTRAINT "external_resources_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "files" ADD CONSTRAINT "files_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_files_fk" FOREIGN KEY ("files_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_external_resources_fk" FOREIGN KEY ("external_resources_id") REFERENCES "public"."external_resources"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "external_resources_cover_idx" ON "external_resources" USING btree ("cover_id");
  CREATE INDEX "files_cover_idx" ON "files" USING btree ("cover_id");
  CREATE INDEX "search_rels_files_id_idx" ON "search_rels" USING btree ("files_id");
  CREATE INDEX "search_rels_external_resources_id_idx" ON "search_rels" USING btree ("external_resources_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "external_resources_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "files_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "external_resources_rels" CASCADE;
  DROP TABLE "files_rels" CASCADE;
  ALTER TABLE "external_resources" DROP CONSTRAINT "external_resources_cover_id_media_id_fk";
  
  ALTER TABLE "files" DROP CONSTRAINT "files_cover_id_media_id_fk";
  
  ALTER TABLE "search_rels" DROP CONSTRAINT "search_rels_files_fk";
  
  ALTER TABLE "search_rels" DROP CONSTRAINT "search_rels_external_resources_fk";
  
  ALTER TABLE "external_resources" ALTER COLUMN "type" SET DATA TYPE text;
  DROP TYPE "public"."enum_external_resources_type";
  CREATE TYPE "public"."enum_external_resources_type" AS ENUM('web_link', 'google-form', 'google-doc');
  ALTER TABLE "external_resources" ALTER COLUMN "type" SET DATA TYPE "public"."enum_external_resources_type" USING "type"::"public"."enum_external_resources_type";
  DROP INDEX "external_resources_cover_idx";
  DROP INDEX "files_cover_idx";
  DROP INDEX "search_rels_files_id_idx";
  DROP INDEX "search_rels_external_resources_id_idx";
  ALTER TABLE "external_resources" DROP COLUMN "cover_id";
  ALTER TABLE "files" DROP COLUMN "cover_id";
  ALTER TABLE "search_rels" DROP COLUMN "files_id";
  ALTER TABLE "search_rels" DROP COLUMN "external_resources_id";`)
}
