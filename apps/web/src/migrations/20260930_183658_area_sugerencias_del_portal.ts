import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_noticia_area" ADD VALUE 'sugerencias-del-portal' BEFORE 'lantalde-teknikoa';
  ALTER TYPE "public"."enum_adjunto_area" ADD VALUE 'sugerencias-del-portal' BEFORE 'lantalde-teknikoa';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "noticia" ALTER COLUMN "area" SET DATA TYPE text;
  DROP TYPE "public"."enum_noticia_area";
  CREATE TYPE "public"."enum_noticia_area" AS ENUM('berriak-pafe', 'partekatutako-berriak', 'ia', 'elkarrizketa-irekiak', 'pafe-ren-elkarrizketak', 'lantalde-teknikoa');
  ALTER TABLE "noticia" ALTER COLUMN "area" SET DATA TYPE "public"."enum_noticia_area" USING "area"::"public"."enum_noticia_area";
  ALTER TABLE "adjunto" ALTER COLUMN "area" SET DATA TYPE text;
  DROP TYPE "public"."enum_adjunto_area";
  CREATE TYPE "public"."enum_adjunto_area" AS ENUM('berriak-pafe', 'partekatutako-berriak', 'ia', 'elkarrizketa-irekiak', 'pafe-ren-elkarrizketak', 'lantalde-teknikoa');
  ALTER TABLE "adjunto" ALTER COLUMN "area" SET DATA TYPE "public"."enum_adjunto_area" USING "area"::"public"."enum_adjunto_area";`)
}
