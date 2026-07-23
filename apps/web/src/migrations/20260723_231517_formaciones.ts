import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "formaciones_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"content" jsonb
  );
  
  CREATE TABLE "formaciones" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"moodle_course_id" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "formaciones_id" integer;
  ALTER TABLE "formaciones_sections" ADD CONSTRAINT "formaciones_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."formaciones"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "formaciones_sections_order_idx" ON "formaciones_sections" USING btree ("_order");
  CREATE INDEX "formaciones_sections_parent_id_idx" ON "formaciones_sections" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "formaciones_slug_idx" ON "formaciones" USING btree ("slug");
  CREATE INDEX "formaciones_moodle_course_id_idx" ON "formaciones" USING btree ("moodle_course_id");
  CREATE INDEX "formaciones_updated_at_idx" ON "formaciones" USING btree ("updated_at");
  CREATE INDEX "formaciones_created_at_idx" ON "formaciones" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_formaciones_fk" FOREIGN KEY ("formaciones_id") REFERENCES "public"."formaciones"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_formaciones_id_idx" ON "payload_locked_documents_rels" USING btree ("formaciones_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "formaciones_sections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "formaciones" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "formaciones_sections" CASCADE;
  DROP TABLE "formaciones" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_formaciones_fk";
  
  DROP INDEX "payload_locked_documents_rels_formaciones_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "formaciones_id";`)
}
