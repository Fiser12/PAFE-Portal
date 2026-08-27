import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_notification_type" ADD VALUE 'vencimiento' BEFORE 'devolucion-tardia';
  ALTER TABLE "reservation" ADD COLUMN "due_notice_sent_for" timestamp(3) with time zone;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "notification" ALTER COLUMN "type" SET DATA TYPE text;
  DROP TYPE "public"."enum_notification_type";
  CREATE TYPE "public"."enum_notification_type" AS ENUM('recordatorio', 'devolucion-tardia', 'perdida', 'recogida', 'prorroga', 'devolucion');
  ALTER TABLE "notification" ALTER COLUMN "type" SET DATA TYPE "public"."enum_notification_type" USING "type"::"public"."enum_notification_type";
  ALTER TABLE "reservation" DROP COLUMN "due_notice_sent_for";`)
}
