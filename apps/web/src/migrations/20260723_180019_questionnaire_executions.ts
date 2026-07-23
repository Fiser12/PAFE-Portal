import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "questionnaire_executions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"questionnaire_id" integer NOT NULL,
  	"user_id" integer NOT NULL,
  	"task_id" integer,
  	"events" jsonb NOT NULL,
  	"outcome" varchar,
  	"schema_i_d" varchar,
  	"schema_version" varchar,
  	"schema_hash" varchar,
  	"started_at" timestamp(3) with time zone,
  	"finished_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "tasks_completed" ADD COLUMN "execution_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "questionnaire_executions_id" integer;
  ALTER TABLE "questionnaire_executions" ADD CONSTRAINT "questionnaire_executions_questionnaire_id_guided_questionnaires_id_fk" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."guided_questionnaires"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "questionnaire_executions" ADD CONSTRAINT "questionnaire_executions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "questionnaire_executions" ADD CONSTRAINT "questionnaire_executions_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "questionnaire_executions_questionnaire_idx" ON "questionnaire_executions" USING btree ("questionnaire_id");
  CREATE INDEX "questionnaire_executions_user_idx" ON "questionnaire_executions" USING btree ("user_id");
  CREATE INDEX "questionnaire_executions_task_idx" ON "questionnaire_executions" USING btree ("task_id");
  CREATE INDEX "questionnaire_executions_finished_at_idx" ON "questionnaire_executions" USING btree ("finished_at");
  CREATE INDEX "questionnaire_executions_updated_at_idx" ON "questionnaire_executions" USING btree ("updated_at");
  CREATE INDEX "questionnaire_executions_created_at_idx" ON "questionnaire_executions" USING btree ("created_at");
  ALTER TABLE "tasks_completed" ADD CONSTRAINT "tasks_completed_execution_id_questionnaire_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."questionnaire_executions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_questionnaire_executions_fk" FOREIGN KEY ("questionnaire_executions_id") REFERENCES "public"."questionnaire_executions"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "tasks_completed_execution_idx" ON "tasks_completed" USING btree ("execution_id");
  CREATE INDEX "payload_locked_documents_rels_questionnaire_executions_i_idx" ON "payload_locked_documents_rels" USING btree ("questionnaire_executions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "questionnaire_executions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "questionnaire_executions" CASCADE;
  ALTER TABLE "tasks_completed" DROP CONSTRAINT "tasks_completed_execution_id_questionnaire_executions_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_questionnaire_executions_fk";
  
  DROP INDEX "tasks_completed_execution_idx";
  DROP INDEX "payload_locked_documents_rels_questionnaire_executions_i_idx";
  ALTER TABLE "tasks_completed" DROP COLUMN "execution_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "questionnaire_executions_id";`)
}
