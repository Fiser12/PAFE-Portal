import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_adjunto_area" AS ENUM('berriak-pafe', 'partekatutako-berriak', 'ia', 'elkarrizketa-irekiak', 'pafe-ren-elkarrizketak', 'lantalde-teknikoa');
  ALTER TABLE "respuesta" ALTER COLUMN "author_id" DROP NOT NULL;
  ALTER TABLE "noticia" ADD COLUMN "source_topic_id" numeric;
  ALTER TABLE "noticia" ADD COLUMN "source_author" varchar;
  ALTER TABLE "noticia" ADD COLUMN "source_author_id" numeric;
  ALTER TABLE "noticia" ADD COLUMN "cerrada" boolean DEFAULT false;
  ALTER TABLE "respuesta" ADD COLUMN "source_post_id" numeric;
  ALTER TABLE "respuesta" ADD COLUMN "source_author" varchar;
  ALTER TABLE "respuesta" ADD COLUMN "source_author_id" numeric;
  ALTER TABLE "respuesta" ADD COLUMN "body" jsonb;
  ALTER TABLE "adjunto" ADD COLUMN "source_key" varchar;
  ALTER TABLE "adjunto" ADD COLUMN "area" "enum_adjunto_area";
  CREATE UNIQUE INDEX "noticia_source_topic_id_idx" ON "noticia" USING btree ("source_topic_id");
  CREATE UNIQUE INDEX "respuesta_source_post_id_idx" ON "respuesta" USING btree ("source_post_id");
  CREATE UNIQUE INDEX "adjunto_source_key_idx" ON "adjunto" USING btree ("source_key");
  CREATE INDEX "adjunto_area_idx" ON "adjunto" USING btree ("area");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "noticia_source_topic_id_idx";
  DROP INDEX "respuesta_source_post_id_idx";
  DROP INDEX "adjunto_source_key_idx";
  DROP INDEX "adjunto_area_idx";
  ALTER TABLE "respuesta" ALTER COLUMN "author_id" SET NOT NULL;
  ALTER TABLE "noticia" DROP COLUMN "source_topic_id";
  ALTER TABLE "noticia" DROP COLUMN "source_author";
  ALTER TABLE "noticia" DROP COLUMN "source_author_id";
  ALTER TABLE "noticia" DROP COLUMN "cerrada";
  ALTER TABLE "respuesta" DROP COLUMN "source_post_id";
  ALTER TABLE "respuesta" DROP COLUMN "source_author";
  ALTER TABLE "respuesta" DROP COLUMN "source_author_id";
  ALTER TABLE "respuesta" DROP COLUMN "body";
  ALTER TABLE "adjunto" DROP COLUMN "source_key";
  ALTER TABLE "adjunto" DROP COLUMN "area";
  DROP TYPE "public"."enum_adjunto_area";`)
}
