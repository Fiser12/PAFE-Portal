import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_notification_type" AS ENUM('recordatorio', 'devolucion-tardia', 'perdida', 'recogida', 'prorroga', 'devolucion');
  CREATE TABLE "notification" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"type" "enum_notification_type" NOT NULL,
  	"message" varchar NOT NULL,
  	"reservation_id" integer,
  	"read_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "notification_id" integer;
  ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "notification" ADD CONSTRAINT "notification_reservation_id_reservation_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservation"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "notification_user_idx" ON "notification" USING btree ("user_id");
  CREATE INDEX "notification_reservation_idx" ON "notification" USING btree ("reservation_id");
  CREATE INDEX "notification_updated_at_idx" ON "notification" USING btree ("updated_at");
  CREATE INDEX "notification_created_at_idx" ON "notification" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_notification_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notification"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_notification_id_idx" ON "payload_locked_documents_rels" USING btree ("notification_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "notification" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "notification" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_notification_fk";
  
  DROP INDEX "payload_locked_documents_rels_notification_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "notification_id";
  DROP TYPE "public"."enum_notification_type";`)
}
