import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_notification_type" ADD VALUE 'noticia';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'avisosTablon' BEFORE 'createCollectionExport';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'avisosTablon' BEFORE 'createCollectionExport';
  CREATE TABLE "noticia" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"area_id" integer NOT NULL,
  	"body" jsonb,
  	"published_at" timestamp(3) with time zone NOT NULL,
  	"pinned" boolean DEFAULT false,
  	"author_id" integer,
  	"notified_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_rels" ADD COLUMN "taxonomy_id" integer;
  ALTER TABLE "notification" ADD COLUMN "noticia_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "noticia_id" integer;
  ALTER TABLE "noticia" ADD CONSTRAINT "noticia_area_id_taxonomy_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."taxonomy"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "noticia" ADD CONSTRAINT "noticia_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "noticia_area_idx" ON "noticia" USING btree ("area_id");
  CREATE INDEX "noticia_published_at_idx" ON "noticia" USING btree ("published_at");
  CREATE INDEX "noticia_author_idx" ON "noticia" USING btree ("author_id");
  CREATE INDEX "noticia_updated_at_idx" ON "noticia" USING btree ("updated_at");
  CREATE INDEX "noticia_created_at_idx" ON "noticia" USING btree ("created_at");
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_taxonomy_fk" FOREIGN KEY ("taxonomy_id") REFERENCES "public"."taxonomy"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "notification" ADD CONSTRAINT "notification_noticia_id_noticia_id_fk" FOREIGN KEY ("noticia_id") REFERENCES "public"."noticia"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_noticia_fk" FOREIGN KEY ("noticia_id") REFERENCES "public"."noticia"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_rels_taxonomy_id_idx" ON "users_rels" USING btree ("taxonomy_id");
  CREATE INDEX "notification_noticia_idx" ON "notification" USING btree ("noticia_id");
  CREATE INDEX "payload_locked_documents_rels_noticia_id_idx" ON "payload_locked_documents_rels" USING btree ("noticia_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "noticia" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "noticia" CASCADE;
  ALTER TABLE "users_rels" DROP CONSTRAINT "users_rels_taxonomy_fk";
  
  ALTER TABLE "notification" DROP CONSTRAINT "notification_noticia_id_noticia_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_noticia_fk";
  
  ALTER TABLE "notification" ALTER COLUMN "type" SET DATA TYPE text;
  DROP TYPE "public"."enum_notification_type";
  CREATE TYPE "public"."enum_notification_type" AS ENUM('recordatorio', 'vencimiento', 'devolucion-tardia', 'perdida', 'recogida', 'prorroga', 'devolucion');
  ALTER TABLE "notification" ALTER COLUMN "type" SET DATA TYPE "public"."enum_notification_type" USING "type"::"public"."enum_notification_type";
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'dueReminders', 'createCollectionExport', 'createCollectionImport', 'schedulePublish');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'dueReminders', 'createCollectionExport', 'createCollectionImport', 'schedulePublish');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX "users_rels_taxonomy_id_idx";
  DROP INDEX "notification_noticia_idx";
  DROP INDEX "payload_locked_documents_rels_noticia_id_idx";
  ALTER TABLE "users_rels" DROP COLUMN "taxonomy_id";
  ALTER TABLE "notification" DROP COLUMN "noticia_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "noticia_id";`)
}
