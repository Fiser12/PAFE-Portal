import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pdf" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "tasks_rels" DROP CONSTRAINT "tasks_rels_pdf_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_pdf_fk";
  DROP INDEX "tasks_rels_pdf_id_idx";
  DROP INDEX "payload_locked_documents_rels_pdf_id_idx";
  ALTER TABLE "tasks_rels" DROP COLUMN "pdf_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "pdf_id";
  DROP TABLE "pdf" CASCADE;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pdf" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"prefix" varchar DEFAULT 'pdf',
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
  
  ALTER TABLE "tasks_rels" ADD COLUMN "pdf_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "pdf_id" integer;
  CREATE INDEX "pdf_updated_at_idx" ON "pdf" USING btree ("updated_at");
  CREATE INDEX "pdf_created_at_idx" ON "pdf" USING btree ("created_at");
  CREATE UNIQUE INDEX "pdf_filename_idx" ON "pdf" USING btree ("filename");
  ALTER TABLE "tasks_rels" ADD CONSTRAINT "tasks_rels_pdf_fk" FOREIGN KEY ("pdf_id") REFERENCES "public"."pdf"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pdf_fk" FOREIGN KEY ("pdf_id") REFERENCES "public"."pdf"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "tasks_rels_pdf_id_idx" ON "tasks_rels" USING btree ("pdf_id");
  CREATE INDEX "payload_locked_documents_rels_pdf_id_idx" ON "payload_locked_documents_rels" USING btree ("pdf_id");`)
}
