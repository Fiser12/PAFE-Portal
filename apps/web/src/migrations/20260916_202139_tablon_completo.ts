import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('es', 'eu');
  CREATE TYPE "public"."enum_noticia_area" AS ENUM('berriak-pafe', 'partekatutako-berriak', 'ia', 'elkarrizketa-irekiak', 'pafe-ren-elkarrizketak', 'lantalde-teknikoa');
  CREATE TYPE "public"."enum__pages_v_published_locale" AS ENUM('es', 'eu');
  CREATE TYPE "public"."enum__posts_v_published_locale" AS ENUM('es', 'eu');
  CREATE TYPE "public"."enum_exports_locale" AS ENUM('all', 'es', 'eu');
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
  	"area" "enum_noticia_area" NOT NULL,
  	"published_at" timestamp(3) with time zone NOT NULL,
  	"pinned" boolean DEFAULT false,
  	"archivada" boolean DEFAULT false,
  	"author_id" integer,
  	"notified_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "noticia_locales" (
  	"title" varchar NOT NULL,
  	"body" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "respuesta" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"mensaje" varchar NOT NULL,
  	"noticia_id" integer NOT NULL,
  	"author_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "adjunto" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"prefix" varchar DEFAULT 'tablon',
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
  
  CREATE TABLE "adjunto_locales" (
  	"alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "catalog_item_locales" (
  	"title" varchar NOT NULL,
  	"content" jsonb,
  	"contributions" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "external_resources_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "taxonomy_locales" (
  	"name" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar,
  	"caption" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "pages_locales" (
  	"meta_title" varchar,
  	"meta_image_id" integer,
  	"meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_pages_v_locales" (
  	"version_meta_title" varchar,
  	"version_meta_image_id" integer,
  	"version_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "posts_locales" (
  	"meta_title" varchar,
  	"meta_image_id" integer,
  	"meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_posts_v_locales" (
  	"version_meta_title" varchar,
  	"version_meta_image_id" integer,
  	"version_meta_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "files_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "search_locales" (
  	"title" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "presentacion_catalogo" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"texto" jsonb DEFAULT '{"root":{"type":"root","direction":"ltr","format":"","indent":0,"version":1,"children":[{"type":"paragraph","version":1,"direction":"ltr","format":"","indent":0,"children":[{"type":"text","version":1,"detail":0,"format":0,"mode":"normal","style":"","text":"Hola, os presentamos el nuevo programa de préstamos de material de PAFE. Mediante esta herramienta tendréis acceso a vídeos, juegos y libros. El préstamo durará un mes, siendo de martes de reunión a martes de reunión (aunque podréis hacer la reserva antes para que tengáis listo el material en la reunión). Se podrá realizar una prórroga de 2 semanas avisando una semana antes de que termine el plazo del préstamo. En caso de devolución tardía, tened en cuenta que esto puede afectar a otras personas del equipo que deseen hacer uso del mismo. Por otro lado, en caso de ruptura o pérdida, el usuario responsable deberá comprar uno similar y entregarlo (en caso de tener cualquier duda, podéis contactar con nosotros para que os asesoremos)."}]},{"type":"paragraph","version":1,"direction":"ltr","format":"","indent":0,"children":[{"type":"text","version":1,"detail":0,"format":0,"mode":"normal","style":"","text":"El catálogo es un material vivo que lo construimos entre todos y todas. Si usáis un material y queréis aportar sugerencias sobre cómo usarlo, para qué perfiles de casos y familias o con qué objetivos, contádnoslo. Y si queréis añadir algún documento descargable, referencia de vídeo o libro en formato electrónico, envíadlo a "},{"type":"link","version":3,"direction":"ltr","format":"","indent":0,"fields":{"linkType":"custom","newTab":false,"url":"mailto:pafe@agintzari.eus"},"children":[{"type":"text","version":1,"detail":0,"format":0,"mode":"normal","style":"","text":"pafe@agintzari.eus"}]},{"type":"text","version":1,"detail":0,"format":0,"mode":"normal","style":"","text":"."}]}]}}'::jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "pages" DROP CONSTRAINT "pages_meta_image_id_media_id_fk";
  
  ALTER TABLE "_pages_v" DROP CONSTRAINT "_pages_v_version_meta_image_id_media_id_fk";
  
  ALTER TABLE "posts" DROP CONSTRAINT "posts_meta_image_id_media_id_fk";
  
  ALTER TABLE "_posts_v" DROP CONSTRAINT "_posts_v_version_meta_image_id_media_id_fk";
  
  ALTER TABLE "users_role" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'admin-catalogo', 'admin-users', 'admin-news', 'familia', 'profesional');
  ALTER TABLE "users_role" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_role" USING "value"::"public"."enum_users_role";
  DROP INDEX "pages_meta_meta_image_idx";
  DROP INDEX "_pages_v_version_meta_version_meta_image_idx";
  DROP INDEX "posts_meta_meta_image_idx";
  DROP INDEX "_posts_v_version_meta_version_meta_image_idx";
  ALTER TABLE "notification" ADD COLUMN "noticia_id" integer;
  ALTER TABLE "notification" ADD COLUMN "tarea_id" integer;
  ALTER TABLE "_pages_v" ADD COLUMN "snapshot" boolean;
  ALTER TABLE "_pages_v" ADD COLUMN "published_locale" "enum__pages_v_published_locale";
  ALTER TABLE "_posts_v" ADD COLUMN "snapshot" boolean;
  ALTER TABLE "_posts_v" ADD COLUMN "published_locale" "enum__posts_v_published_locale";
  ALTER TABLE "exports" ADD COLUMN "locale" "enum_exports_locale" DEFAULT 'all';
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "noticia_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "respuesta_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "adjunto_id" integer;
  ALTER TABLE "noticia" ADD CONSTRAINT "noticia_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "noticia_locales" ADD CONSTRAINT "noticia_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."noticia"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "respuesta" ADD CONSTRAINT "respuesta_noticia_id_noticia_id_fk" FOREIGN KEY ("noticia_id") REFERENCES "public"."noticia"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "respuesta" ADD CONSTRAINT "respuesta_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "adjunto_locales" ADD CONSTRAINT "adjunto_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."adjunto"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "catalog_item_locales" ADD CONSTRAINT "catalog_item_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."catalog_item"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "external_resources_locales" ADD CONSTRAINT "external_resources_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."external_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "taxonomy_locales" ADD CONSTRAINT "taxonomy_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."taxonomy"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_locales" ADD CONSTRAINT "pages_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_locales" ADD CONSTRAINT "_pages_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_locales" ADD CONSTRAINT "posts_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_locales" ADD CONSTRAINT "posts_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_locales" ADD CONSTRAINT "_posts_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v_locales" ADD CONSTRAINT "_posts_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "files_locales" ADD CONSTRAINT "files_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_locales" ADD CONSTRAINT "search_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "noticia_area_idx" ON "noticia" USING btree ("area");
  CREATE INDEX "noticia_published_at_idx" ON "noticia" USING btree ("published_at");
  CREATE INDEX "noticia_archivada_idx" ON "noticia" USING btree ("archivada");
  CREATE INDEX "noticia_author_idx" ON "noticia" USING btree ("author_id");
  CREATE INDEX "noticia_updated_at_idx" ON "noticia" USING btree ("updated_at");
  CREATE INDEX "noticia_created_at_idx" ON "noticia" USING btree ("created_at");
  CREATE UNIQUE INDEX "noticia_locales_locale_parent_id_unique" ON "noticia_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "respuesta_noticia_idx" ON "respuesta" USING btree ("noticia_id");
  CREATE INDEX "respuesta_author_idx" ON "respuesta" USING btree ("author_id");
  CREATE INDEX "respuesta_updated_at_idx" ON "respuesta" USING btree ("updated_at");
  CREATE INDEX "respuesta_created_at_idx" ON "respuesta" USING btree ("created_at");
  CREATE INDEX "adjunto_updated_at_idx" ON "adjunto" USING btree ("updated_at");
  CREATE INDEX "adjunto_created_at_idx" ON "adjunto" USING btree ("created_at");
  CREATE UNIQUE INDEX "adjunto_filename_idx" ON "adjunto" USING btree ("filename");
  CREATE UNIQUE INDEX "adjunto_locales_locale_parent_id_unique" ON "adjunto_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "catalog_item_locales_locale_parent_id_unique" ON "catalog_item_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "external_resources_locales_locale_parent_id_unique" ON "external_resources_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "taxonomy_locales_locale_parent_id_unique" ON "taxonomy_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "pages_meta_meta_image_idx" ON "pages_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "pages_locales_locale_parent_id_unique" ON "pages_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_pages_v_version_meta_version_meta_image_idx" ON "_pages_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_pages_v_locales_locale_parent_id_unique" ON "_pages_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "posts_meta_meta_image_idx" ON "posts_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "posts_locales_locale_parent_id_unique" ON "posts_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_posts_v_version_meta_version_meta_image_idx" ON "_posts_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_posts_v_locales_locale_parent_id_unique" ON "_posts_v_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "files_locales_locale_parent_id_unique" ON "files_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "search_locales_locale_parent_id_unique" ON "search_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "notification" ADD CONSTRAINT "notification_noticia_id_noticia_id_fk" FOREIGN KEY ("noticia_id") REFERENCES "public"."noticia"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "notification" ADD CONSTRAINT "notification_tarea_id_tasks_id_fk" FOREIGN KEY ("tarea_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_noticia_fk" FOREIGN KEY ("noticia_id") REFERENCES "public"."noticia"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_respuesta_fk" FOREIGN KEY ("respuesta_id") REFERENCES "public"."respuesta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_adjunto_fk" FOREIGN KEY ("adjunto_id") REFERENCES "public"."adjunto"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "notification_noticia_idx" ON "notification" USING btree ("noticia_id");
  CREATE INDEX "notification_tarea_idx" ON "notification" USING btree ("tarea_id");
  CREATE INDEX "_pages_v_snapshot_idx" ON "_pages_v" USING btree ("snapshot");
  CREATE INDEX "_pages_v_published_locale_idx" ON "_pages_v" USING btree ("published_locale");
  CREATE INDEX "_posts_v_snapshot_idx" ON "_posts_v" USING btree ("snapshot");
  CREATE INDEX "_posts_v_published_locale_idx" ON "_posts_v" USING btree ("published_locale");
  CREATE INDEX "payload_locked_documents_rels_noticia_id_idx" ON "payload_locked_documents_rels" USING btree ("noticia_id");
  CREATE INDEX "payload_locked_documents_rels_respuesta_id_idx" ON "payload_locked_documents_rels" USING btree ("respuesta_id");
  CREATE INDEX "payload_locked_documents_rels_adjunto_id_idx" ON "payload_locked_documents_rels" USING btree ("adjunto_id");
  ALTER TABLE "catalog_item" DROP COLUMN "title";
  ALTER TABLE "catalog_item" DROP COLUMN "content";
  ALTER TABLE "catalog_item" DROP COLUMN "contributions";
  ALTER TABLE "external_resources" DROP COLUMN "title";
  ALTER TABLE "external_resources" DROP COLUMN "description";
  ALTER TABLE "taxonomy" DROP COLUMN "name";
  ALTER TABLE "media" DROP COLUMN "alt";
  ALTER TABLE "media" DROP COLUMN "caption";
  ALTER TABLE "pages" DROP COLUMN "meta_title";
  ALTER TABLE "pages" DROP COLUMN "meta_image_id";
  ALTER TABLE "pages" DROP COLUMN "meta_description";
  ALTER TABLE "_pages_v" DROP COLUMN "version_meta_title";
  ALTER TABLE "_pages_v" DROP COLUMN "version_meta_image_id";
  ALTER TABLE "_pages_v" DROP COLUMN "version_meta_description";
  ALTER TABLE "posts" DROP COLUMN "meta_title";
  ALTER TABLE "posts" DROP COLUMN "meta_image_id";
  ALTER TABLE "posts" DROP COLUMN "meta_description";
  ALTER TABLE "_posts_v" DROP COLUMN "version_meta_title";
  ALTER TABLE "_posts_v" DROP COLUMN "version_meta_image_id";
  ALTER TABLE "_posts_v" DROP COLUMN "version_meta_description";
  ALTER TABLE "files" DROP COLUMN "title";
  ALTER TABLE "search" DROP COLUMN "title";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "noticia" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "noticia_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "respuesta" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "adjunto" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "adjunto_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "catalog_item_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "external_resources_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "taxonomy_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "media_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "posts_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_posts_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "files_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "search_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "presentacion_catalogo" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "noticia" CASCADE;
  DROP TABLE "noticia_locales" CASCADE;
  DROP TABLE "respuesta" CASCADE;
  DROP TABLE "adjunto" CASCADE;
  DROP TABLE "adjunto_locales" CASCADE;
  DROP TABLE "catalog_item_locales" CASCADE;
  DROP TABLE "external_resources_locales" CASCADE;
  DROP TABLE "taxonomy_locales" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "pages_locales" CASCADE;
  DROP TABLE "_pages_v_locales" CASCADE;
  DROP TABLE "posts_locales" CASCADE;
  DROP TABLE "_posts_v_locales" CASCADE;
  DROP TABLE "files_locales" CASCADE;
  DROP TABLE "search_locales" CASCADE;
  DROP TABLE "presentacion_catalogo" CASCADE;
  ALTER TABLE "notification" DROP CONSTRAINT "notification_noticia_id_noticia_id_fk";
  
  ALTER TABLE "notification" DROP CONSTRAINT "notification_tarea_id_tasks_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_noticia_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_respuesta_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_adjunto_fk";
  
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
  DROP INDEX "_pages_v_snapshot_idx";
  DROP INDEX "_pages_v_published_locale_idx";
  DROP INDEX "_posts_v_snapshot_idx";
  DROP INDEX "_posts_v_published_locale_idx";
  DROP INDEX "payload_locked_documents_rels_noticia_id_idx";
  DROP INDEX "payload_locked_documents_rels_respuesta_id_idx";
  DROP INDEX "payload_locked_documents_rels_adjunto_id_idx";
  ALTER TABLE "catalog_item" ADD COLUMN "title" varchar NOT NULL;
  ALTER TABLE "catalog_item" ADD COLUMN "content" jsonb;
  ALTER TABLE "catalog_item" ADD COLUMN "contributions" jsonb;
  ALTER TABLE "external_resources" ADD COLUMN "title" varchar NOT NULL;
  ALTER TABLE "external_resources" ADD COLUMN "description" varchar;
  ALTER TABLE "taxonomy" ADD COLUMN "name" varchar NOT NULL;
  ALTER TABLE "media" ADD COLUMN "alt" varchar;
  ALTER TABLE "media" ADD COLUMN "caption" jsonb;
  ALTER TABLE "pages" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "pages" ADD COLUMN "meta_image_id" integer;
  ALTER TABLE "pages" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_meta_title" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_meta_image_id" integer;
  ALTER TABLE "_pages_v" ADD COLUMN "version_meta_description" varchar;
  ALTER TABLE "posts" ADD COLUMN "meta_title" varchar;
  ALTER TABLE "posts" ADD COLUMN "meta_image_id" integer;
  ALTER TABLE "posts" ADD COLUMN "meta_description" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN "version_meta_title" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN "version_meta_image_id" integer;
  ALTER TABLE "_posts_v" ADD COLUMN "version_meta_description" varchar;
  ALTER TABLE "files" ADD COLUMN "title" varchar NOT NULL;
  ALTER TABLE "search" ADD COLUMN "title" varchar;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_meta_meta_image_idx" ON "pages" USING btree ("meta_image_id");
  CREATE INDEX "_pages_v_version_meta_version_meta_image_idx" ON "_pages_v" USING btree ("version_meta_image_id");
  CREATE INDEX "posts_meta_meta_image_idx" ON "posts" USING btree ("meta_image_id");
  CREATE INDEX "_posts_v_version_meta_version_meta_image_idx" ON "_posts_v" USING btree ("version_meta_image_id");
  ALTER TABLE "notification" DROP COLUMN "noticia_id";
  ALTER TABLE "notification" DROP COLUMN "tarea_id";
  ALTER TABLE "_pages_v" DROP COLUMN "snapshot";
  ALTER TABLE "_pages_v" DROP COLUMN "published_locale";
  ALTER TABLE "_posts_v" DROP COLUMN "snapshot";
  ALTER TABLE "_posts_v" DROP COLUMN "published_locale";
  ALTER TABLE "exports" DROP COLUMN "locale";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "noticia_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "respuesta_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "adjunto_id";
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_noticia_area";
  DROP TYPE "public"."enum__pages_v_published_locale";
  DROP TYPE "public"."enum__posts_v_published_locale";
  DROP TYPE "public"."enum_exports_locale";`)
}
