import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_reservation_status" AS ENUM('reservada', 'activa', 'devuelta', 'perdida', 'cancelada');
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'dueReminders' BEFORE 'createCollectionExport';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'dueReminders' BEFORE 'createCollectionExport';
  CREATE TABLE "payload_jobs_stats" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stats" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users" ADD COLUMN "late_returns_count" numeric DEFAULT 0;
  ALTER TABLE "users" ADD COLUMN "penalized_until" timestamp(3) with time zone;
  ALTER TABLE "reservation" ADD COLUMN "status" "enum_reservation_status" DEFAULT 'reservada' NOT NULL;
  ALTER TABLE "reservation" ADD COLUMN "pickup_date" timestamp(3) with time zone;
  ALTER TABLE "reservation" ADD COLUMN "due_date" timestamp(3) with time zone;
  ALTER TABLE "reservation" ADD COLUMN "extension_requested_at" timestamp(3) with time zone;
  ALTER TABLE "reservation" ADD COLUMN "returned_at" timestamp(3) with time zone;
  ALTER TABLE "reservation" ADD COLUMN "returned_late" boolean DEFAULT false;
  ALTER TABLE "reservation" ADD COLUMN "loss_reported_at" timestamp(3) with time zone;
  ALTER TABLE "reservation" ADD COLUMN "loss_replacement_deadline" timestamp(3) with time zone;
  ALTER TABLE "reservation" ADD COLUMN "loss_replaced_at" timestamp(3) with time zone;
  ALTER TABLE "reservation" ADD COLUMN "quota_override_reason" varchar;
  ALTER TABLE "reservation" ADD COLUMN "reminder_sent_for" timestamp(3) with time zone;
  ALTER TABLE "catalog_item" ADD COLUMN "contributions" jsonb;
  ALTER TABLE "payload_jobs" ADD COLUMN "meta" jsonb;
  ALTER TABLE "catalog_item" DROP COLUMN "loan_days";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload_jobs_stats" CASCADE;
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'createCollectionExport', 'createCollectionImport', 'schedulePublish');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'createCollectionExport', 'createCollectionImport', 'schedulePublish');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  ALTER TABLE "catalog_item" ADD COLUMN "loan_days" numeric;
  ALTER TABLE "users" DROP COLUMN "late_returns_count";
  ALTER TABLE "users" DROP COLUMN "penalized_until";
  ALTER TABLE "reservation" DROP COLUMN "status";
  ALTER TABLE "reservation" DROP COLUMN "pickup_date";
  ALTER TABLE "reservation" DROP COLUMN "due_date";
  ALTER TABLE "reservation" DROP COLUMN "extension_requested_at";
  ALTER TABLE "reservation" DROP COLUMN "returned_at";
  ALTER TABLE "reservation" DROP COLUMN "returned_late";
  ALTER TABLE "reservation" DROP COLUMN "loss_reported_at";
  ALTER TABLE "reservation" DROP COLUMN "loss_replacement_deadline";
  ALTER TABLE "reservation" DROP COLUMN "loss_replaced_at";
  ALTER TABLE "reservation" DROP COLUMN "quota_override_reason";
  ALTER TABLE "reservation" DROP COLUMN "reminder_sent_for";
  ALTER TABLE "catalog_item" DROP COLUMN "contributions";
  ALTER TABLE "payload_jobs" DROP COLUMN "meta";
  DROP TYPE "public"."enum_reservation_status";`)
}
