import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "groups" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_rels" ADD COLUMN "groups_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "groups_id" integer;
  CREATE UNIQUE INDEX "groups_name_idx" ON "groups" USING btree ("name");
  CREATE INDEX "groups_updated_at_idx" ON "groups" USING btree ("updated_at");
  CREATE INDEX "groups_created_at_idx" ON "groups" USING btree ("created_at");
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_groups_fk" FOREIGN KEY ("groups_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_groups_fk" FOREIGN KEY ("groups_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_rels_groups_id_idx" ON "users_rels" USING btree ("groups_id");
  CREATE INDEX "payload_locked_documents_rels_groups_id_idx" ON "payload_locked_documents_rels" USING btree ("groups_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "groups" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "groups" CASCADE;
  ALTER TABLE "users_rels" DROP CONSTRAINT "users_rels_groups_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_groups_fk";
  
  DROP INDEX "users_rels_groups_id_idx";
  DROP INDEX "payload_locked_documents_rels_groups_id_idx";
  ALTER TABLE "users_rels" DROP COLUMN "groups_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "groups_id";`)
}
