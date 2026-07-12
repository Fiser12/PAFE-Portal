import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "files" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"prefix" varchar DEFAULT 'files',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  ALTER TABLE "digital_item" DROP CONSTRAINT "digital_item_file_id_pdf_id_fk";
  
  ALTER TABLE "tasks_rels" ADD COLUMN "files_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "files_id" integer;
  CREATE INDEX "files_updated_at_idx" ON "files" USING btree ("updated_at");
  CREATE INDEX "files_created_at_idx" ON "files" USING btree ("created_at");
  CREATE UNIQUE INDEX "files_filename_idx" ON "files" USING btree ("filename");
  ALTER TABLE "digital_item" ADD CONSTRAINT "digital_item_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tasks_rels" ADD CONSTRAINT "tasks_rels_files_fk" FOREIGN KEY ("files_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_files_fk" FOREIGN KEY ("files_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "tasks_rels_files_id_idx" ON "tasks_rels" USING btree ("files_id");
  CREATE INDEX "payload_locked_documents_rels_files_id_idx" ON "payload_locked_documents_rels" USING btree ("files_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "files" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "files" CASCADE;
  ALTER TABLE "digital_item" DROP CONSTRAINT "digital_item_file_id_files_id_fk";
  
  ALTER TABLE "tasks_rels" DROP CONSTRAINT "tasks_rels_files_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_files_fk";
  
  DROP INDEX "tasks_rels_files_id_idx";
  DROP INDEX "payload_locked_documents_rels_files_id_idx";
  ALTER TABLE "digital_item" ADD CONSTRAINT "digital_item_file_id_pdf_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."pdf"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tasks_rels" DROP COLUMN "files_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "files_id";`)
}
