import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_noticia_area" AS ENUM('berriak-pafe', 'partekatutako-berriak', 'ia', 'elkarrizketa-irekiak', 'pafe-ren-elkarrizketak', 'lantalde-teknikoa');
  ALTER TYPE "public"."enum_admin_invitations_role" ADD VALUE 'admin-catalogo' BEFORE 'profesional';
  ALTER TYPE "public"."enum_admin_invitations_role" ADD VALUE 'admin-users' BEFORE 'profesional';
  ALTER TYPE "public"."enum_admin_invitations_role" ADD VALUE 'admin-news' BEFORE 'profesional';
  ALTER TYPE "public"."enum_notification_type" ADD VALUE 'noticia';
  ALTER TYPE "public"."enum_notification_type" ADD VALUE 'tarea-asignada';
  ALTER TYPE "public"."enum_notification_type" ADD VALUE 'tarea-toca';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'avisosTablon' BEFORE 'createCollectionExport';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'avisosTareas' BEFORE 'createCollectionExport';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'avisosTablon' BEFORE 'createCollectionExport';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'avisosTareas' BEFORE 'createCollectionExport';
  CREATE TABLE "noticia" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"area" "enum_noticia_area" NOT NULL,
  	"body" jsonb,
  	"published_at" timestamp(3) with time zone NOT NULL,
  	"pinned" boolean DEFAULT false,
  	"author_id" integer,
  	"notified_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "presentacion_catalogo" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"texto" jsonb DEFAULT '{"root":{"type":"root","direction":"ltr","format":"","indent":0,"version":1,"children":[{"type":"paragraph","version":1,"direction":"ltr","format":"","indent":0,"children":[{"type":"text","version":1,"detail":0,"format":0,"mode":"normal","style":"","text":"Hola, os presentamos el nuevo programa de préstamos de material de PAFE. Mediante esta herramienta tendréis acceso a vídeos, juegos y libros. El préstamo durará un mes, siendo de martes de reunión a martes de reunión (aunque podréis hacer la reserva antes para que tengáis listo el material en la reunión). Se podrá realizar una prórroga de 2 semanas avisando una semana antes de que termine el plazo del préstamo. En caso de devolución tardía, tened en cuenta que esto puede afectar a otras personas del equipo que deseen hacer uso del mismo. Por otro lado, en caso de ruptura o pérdida, el usuario responsable deberá comprar uno similar y entregarlo (en caso de tener cualquier duda, podéis contactar con nosotros para que os asesoremos)."}]},{"type":"paragraph","version":1,"direction":"ltr","format":"","indent":0,"children":[{"type":"text","version":1,"detail":0,"format":0,"mode":"normal","style":"","text":"El catálogo es un material vivo que lo construimos entre todos y todas. Si usáis un material y queréis aportar sugerencias sobre cómo usarlo, para qué perfiles de casos y familias o con qué objetivos, contádnoslo. Y si queréis añadir algún documento descargable, referencia de vídeo o libro en formato electrónico, envíadlo a "},{"type":"link","version":3,"direction":"ltr","format":"","indent":0,"fields":{"linkType":"custom","newTab":false,"url":"mailto:pafe@agintzari.eus"},"children":[{"type":"text","version":1,"detail":0,"format":0,"mode":"normal","style":"","text":"pafe@agintzari.eus"}]},{"type":"text","version":1,"detail":0,"format":0,"mode":"normal","style":"","text":"."}]}]}}'::jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_role" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'admin-catalogo', 'admin-users', 'admin-news', 'familia', 'profesional');
  ALTER TABLE "users_role" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_role" USING "value"::"public"."enum_users_role";
  ALTER TABLE "notification" ADD COLUMN "noticia_id" integer;
  ALTER TABLE "notification" ADD COLUMN "tarea_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "noticia_id" integer;
  ALTER TABLE "noticia" ADD CONSTRAINT "noticia_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "noticia_area_idx" ON "noticia" USING btree ("area");
  CREATE INDEX "noticia_published_at_idx" ON "noticia" USING btree ("published_at");
  CREATE INDEX "noticia_author_idx" ON "noticia" USING btree ("author_id");
  CREATE INDEX "noticia_updated_at_idx" ON "noticia" USING btree ("updated_at");
  CREATE INDEX "noticia_created_at_idx" ON "noticia" USING btree ("created_at");
  ALTER TABLE "notification" ADD CONSTRAINT "notification_noticia_id_noticia_id_fk" FOREIGN KEY ("noticia_id") REFERENCES "public"."noticia"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "notification" ADD CONSTRAINT "notification_tarea_id_tasks_id_fk" FOREIGN KEY ("tarea_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_noticia_fk" FOREIGN KEY ("noticia_id") REFERENCES "public"."noticia"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "notification_noticia_idx" ON "notification" USING btree ("noticia_id");
  CREATE INDEX "notification_tarea_idx" ON "notification" USING btree ("tarea_id");
  CREATE INDEX "payload_locked_documents_rels_noticia_id_idx" ON "payload_locked_documents_rels" USING btree ("noticia_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "noticia" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "presentacion_catalogo" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "noticia" CASCADE;
  DROP TABLE "presentacion_catalogo" CASCADE;
  ALTER TABLE "notification" DROP CONSTRAINT "notification_noticia_id_noticia_id_fk";
  
  ALTER TABLE "notification" DROP CONSTRAINT "notification_tarea_id_tasks_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_noticia_fk";
  
  ALTER TABLE "users_role" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'profesional', 'familia');
  ALTER TABLE "users_role" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_role" USING "value"::"public"."enum_users_role";
  ALTER TABLE "admin_invitations" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "admin_invitations" ALTER COLUMN "role" SET DEFAULT 'admin'::text;
  DROP TYPE "public"."enum_admin_invitations_role";
  CREATE TYPE "public"."enum_admin_invitations_role" AS ENUM('admin', 'profesional', 'familia');
  ALTER TABLE "admin_invitations" ALTER COLUMN "role" SET DEFAULT 'admin'::"public"."enum_admin_invitations_role";
  ALTER TABLE "admin_invitations" ALTER COLUMN "role" SET DATA TYPE "public"."enum_admin_invitations_role" USING "role"::"public"."enum_admin_invitations_role";
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
  DROP INDEX "notification_noticia_idx";
  DROP INDEX "notification_tarea_idx";
  DROP INDEX "payload_locked_documents_rels_noticia_id_idx";
  ALTER TABLE "notification" DROP COLUMN "noticia_id";
  ALTER TABLE "notification" DROP COLUMN "tarea_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "noticia_id";
  DROP TYPE "public"."enum_noticia_area";`)
}
