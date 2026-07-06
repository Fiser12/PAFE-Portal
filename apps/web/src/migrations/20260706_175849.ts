import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_external_resources_type" AS ENUM('web_link', 'google-form', 'google-doc');
  CREATE TYPE "public"."enum_exports_sort_order" AS ENUM('asc', 'desc');
  CREATE TYPE "public"."enum_imports_import_mode" AS ENUM('create', 'update', 'upsert');
  CREATE TYPE "public"."enum_imports_status" AS ENUM('pending', 'completed', 'partial', 'failed');
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'createCollectionExport' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'createCollectionImport' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'createCollectionExport' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'createCollectionImport' BEFORE 'schedulePublish';
  CREATE TABLE "external_resources" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"type" "enum_external_resources_type" NOT NULL,
  	"url" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "imports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"collection_slug" varchar NOT NULL,
  	"import_mode" "enum_imports_import_mode",
  	"match_field" varchar DEFAULT 'id',
  	"status" "enum_imports_status" DEFAULT 'pending',
  	"summary_imported" numeric,
  	"summary_updated" numeric,
  	"summary_total" numeric,
  	"summary_issues" numeric,
  	"summary_issue_details" jsonb,
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
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  ALTER TABLE "taxonomy" RENAME COLUMN "singular_name" TO "name";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_exports_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_payload_jobs_fk";
  
  DROP INDEX "exports_texts_order_parent_idx";
  DROP INDEX "payload_locked_documents_rels_exports_id_idx";
  DROP INDEX "payload_locked_documents_rels_payload_jobs_id_idx";
  DROP INDEX "taxonomy_slug_idx";
  ALTER TABLE "taxonomy" ALTER COLUMN "slug" SET NOT NULL;
  ALTER TABLE "forms_emails" ALTER COLUMN "subject" SET DEFAULT 'You''ve received a new message.';
  ALTER TABLE "tasks_rels" ADD COLUMN "pdf_id" integer;
  ALTER TABLE "tasks_rels" ADD COLUMN "forms_id" integer;
  ALTER TABLE "tasks_rels" ADD COLUMN "external_resources_id" integer;
  ALTER TABLE "tasks_rels" ADD COLUMN "posts_id" integer;
  ALTER TABLE "taxonomy" ADD COLUMN "generate_slug" boolean DEFAULT true;
  ALTER TABLE "exports" ADD COLUMN "page" numeric DEFAULT 1;
  ALTER TABLE "exports" ADD COLUMN "sort_order" "enum_exports_sort_order";
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "external_resources_id" integer;
  CREATE INDEX "external_resources_updated_at_idx" ON "external_resources" USING btree ("updated_at");
  CREATE INDEX "external_resources_created_at_idx" ON "external_resources" USING btree ("created_at");
  CREATE INDEX "imports_updated_at_idx" ON "imports" USING btree ("updated_at");
  CREATE INDEX "imports_created_at_idx" ON "imports" USING btree ("created_at");
  CREATE UNIQUE INDEX "imports_filename_idx" ON "imports" USING btree ("filename");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  ALTER TABLE "tasks_rels" ADD CONSTRAINT "tasks_rels_pdf_fk" FOREIGN KEY ("pdf_id") REFERENCES "public"."pdf"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tasks_rels" ADD CONSTRAINT "tasks_rels_forms_fk" FOREIGN KEY ("forms_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tasks_rels" ADD CONSTRAINT "tasks_rels_external_resources_fk" FOREIGN KEY ("external_resources_id") REFERENCES "public"."external_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tasks_rels" ADD CONSTRAINT "tasks_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_external_resources_fk" FOREIGN KEY ("external_resources_id") REFERENCES "public"."external_resources"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "tasks_rels_pdf_id_idx" ON "tasks_rels" USING btree ("pdf_id");
  CREATE INDEX "tasks_rels_forms_id_idx" ON "tasks_rels" USING btree ("forms_id");
  CREATE INDEX "tasks_rels_external_resources_id_idx" ON "tasks_rels" USING btree ("external_resources_id");
  CREATE INDEX "tasks_rels_posts_id_idx" ON "tasks_rels" USING btree ("posts_id");
  CREATE INDEX "exports_texts_order_parent" ON "exports_texts" USING btree ("order","parent_id");
  CREATE INDEX "payload_locked_documents_rels_external_resources_id_idx" ON "payload_locked_documents_rels" USING btree ("external_resources_id");
  CREATE UNIQUE INDEX "taxonomy_slug_idx" ON "taxonomy" USING btree ("slug");
  ALTER TABLE "taxonomy" DROP COLUMN "slug_lock";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "exports_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "payload_jobs_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "external_resources" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "imports" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_kv" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "external_resources" CASCADE;
  DROP TABLE "imports" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  ALTER TABLE "taxonomy" RENAME COLUMN "name" TO "singular_name";
  ALTER TABLE "tasks_rels" DROP CONSTRAINT "tasks_rels_pdf_fk";
  
  ALTER TABLE "tasks_rels" DROP CONSTRAINT "tasks_rels_forms_fk";
  
  ALTER TABLE "tasks_rels" DROP CONSTRAINT "tasks_rels_external_resources_fk";
  
  ALTER TABLE "tasks_rels" DROP CONSTRAINT "tasks_rels_posts_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_external_resources_fk";
  
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX "tasks_rels_pdf_id_idx";
  DROP INDEX "tasks_rels_forms_id_idx";
  DROP INDEX "tasks_rels_external_resources_id_idx";
  DROP INDEX "tasks_rels_posts_id_idx";
  DROP INDEX "exports_texts_order_parent";
  DROP INDEX "payload_locked_documents_rels_external_resources_id_idx";
  DROP INDEX "taxonomy_slug_idx";
  ALTER TABLE "taxonomy" ALTER COLUMN "slug" DROP NOT NULL;
  ALTER TABLE "forms_emails" ALTER COLUMN "subject" SET DEFAULT 'You''''ve received a new message.';
  ALTER TABLE "taxonomy" ADD COLUMN "slug_lock" boolean DEFAULT true;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "exports_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "payload_jobs_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_exports_fk" FOREIGN KEY ("exports_id") REFERENCES "public"."exports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_jobs_fk" FOREIGN KEY ("payload_jobs_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "exports_texts_order_parent_idx" ON "exports_texts" USING btree ("order","parent_id");
  CREATE INDEX "payload_locked_documents_rels_exports_id_idx" ON "payload_locked_documents_rels" USING btree ("exports_id");
  CREATE INDEX "payload_locked_documents_rels_payload_jobs_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_jobs_id");
  CREATE INDEX "taxonomy_slug_idx" ON "taxonomy" USING btree ("slug");
  ALTER TABLE "tasks_rels" DROP COLUMN "pdf_id";
  ALTER TABLE "tasks_rels" DROP COLUMN "forms_id";
  ALTER TABLE "tasks_rels" DROP COLUMN "external_resources_id";
  ALTER TABLE "tasks_rels" DROP COLUMN "posts_id";
  ALTER TABLE "taxonomy" DROP COLUMN "generate_slug";
  ALTER TABLE "exports" DROP COLUMN "page";
  ALTER TABLE "exports" DROP COLUMN "sort_order";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "external_resources_id";
  DROP TYPE "public"."enum_external_resources_type";
  DROP TYPE "public"."enum_exports_sort_order";
  DROP TYPE "public"."enum_imports_import_mode";
  DROP TYPE "public"."enum_imports_status";`)
}
