import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "guided_questionnaires_page_contents" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"page_i_d" varchar NOT NULL,
  	"content" jsonb
  );
  
  ALTER TABLE "guided_questionnaires_page_contents" ADD CONSTRAINT "guided_questionnaires_page_contents_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."guided_questionnaires"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "guided_questionnaires_page_contents_order_idx" ON "guided_questionnaires_page_contents" USING btree ("_order");
  CREATE INDEX "guided_questionnaires_page_contents_parent_id_idx" ON "guided_questionnaires_page_contents" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "guided_questionnaires_page_contents" CASCADE;`)
}
