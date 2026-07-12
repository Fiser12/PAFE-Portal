import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_catalog_item_type" AS ENUM('libro', 'juego', 'programa');
  CREATE TYPE "public"."enum_digital_item_type" AS ENUM('video', 'ebook');
  CREATE TABLE "digital_item" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"cover_id" integer,
  	"title" varchar NOT NULL,
  	"type" "enum_digital_item_type" NOT NULL,
  	"description" varchar,
  	"url" varchar,
  	"file_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "digital_item_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"taxonomy_id" integer
  );
  
  ALTER TABLE "catalog_item" ADD COLUMN "type" "enum_catalog_item_type" DEFAULT 'libro' NOT NULL;
  ALTER TABLE "search_rels" ADD COLUMN "catalog_item_id" integer;
  ALTER TABLE "search_rels" ADD COLUMN "digital_item_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "digital_item_id" integer;
  ALTER TABLE "digital_item" ADD CONSTRAINT "digital_item_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "digital_item" ADD CONSTRAINT "digital_item_file_id_pdf_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."pdf"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "digital_item_rels" ADD CONSTRAINT "digital_item_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."digital_item"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "digital_item_rels" ADD CONSTRAINT "digital_item_rels_taxonomy_fk" FOREIGN KEY ("taxonomy_id") REFERENCES "public"."taxonomy"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "digital_item_cover_idx" ON "digital_item" USING btree ("cover_id");
  CREATE INDEX "digital_item_file_idx" ON "digital_item" USING btree ("file_id");
  CREATE INDEX "digital_item_updated_at_idx" ON "digital_item" USING btree ("updated_at");
  CREATE INDEX "digital_item_created_at_idx" ON "digital_item" USING btree ("created_at");
  CREATE INDEX "digital_item_rels_order_idx" ON "digital_item_rels" USING btree ("order");
  CREATE INDEX "digital_item_rels_parent_idx" ON "digital_item_rels" USING btree ("parent_id");
  CREATE INDEX "digital_item_rels_path_idx" ON "digital_item_rels" USING btree ("path");
  CREATE INDEX "digital_item_rels_taxonomy_id_idx" ON "digital_item_rels" USING btree ("taxonomy_id");
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_catalog_item_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_item"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_digital_item_fk" FOREIGN KEY ("digital_item_id") REFERENCES "public"."digital_item"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_digital_item_fk" FOREIGN KEY ("digital_item_id") REFERENCES "public"."digital_item"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "search_rels_catalog_item_id_idx" ON "search_rels" USING btree ("catalog_item_id");
  CREATE INDEX "search_rels_digital_item_id_idx" ON "search_rels" USING btree ("digital_item_id");
  CREATE INDEX "payload_locked_documents_rels_digital_item_id_idx" ON "payload_locked_documents_rels" USING btree ("digital_item_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "digital_item" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "digital_item_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "digital_item" CASCADE;
  DROP TABLE "digital_item_rels" CASCADE;
  ALTER TABLE "search_rels" DROP CONSTRAINT "search_rels_catalog_item_fk";
  
  ALTER TABLE "search_rels" DROP CONSTRAINT "search_rels_digital_item_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_digital_item_fk";
  
  DROP INDEX "search_rels_catalog_item_id_idx";
  DROP INDEX "search_rels_digital_item_id_idx";
  DROP INDEX "payload_locked_documents_rels_digital_item_id_idx";
  ALTER TABLE "catalog_item" DROP COLUMN "type";
  ALTER TABLE "search_rels" DROP COLUMN "catalog_item_id";
  ALTER TABLE "search_rels" DROP COLUMN "digital_item_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "digital_item_id";
  DROP TYPE "public"."enum_catalog_item_type";
  DROP TYPE "public"."enum_digital_item_type";`)
}
