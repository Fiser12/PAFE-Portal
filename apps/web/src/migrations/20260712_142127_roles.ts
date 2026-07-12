import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users_rels" DROP CONSTRAINT "users_rels_taxonomy_fk";
  
  ALTER TABLE "users_role" ALTER COLUMN "value" SET DATA TYPE text;
  DELETE FROM "users_role" WHERE "value" NOT IN ('admin', 'profesional', 'familia');
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'profesional', 'familia');
  ALTER TABLE "users_role" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_role" USING "value"::"public"."enum_users_role";
  ALTER TABLE "admin_invitations" ALTER COLUMN "role" SET DATA TYPE text;
  UPDATE "admin_invitations" SET "role" = 'admin' WHERE "role" NOT IN ('admin', 'profesional', 'familia');
  ALTER TABLE "admin_invitations" ALTER COLUMN "role" SET DEFAULT 'admin'::text;
  DROP TYPE "public"."enum_admin_invitations_role";
  CREATE TYPE "public"."enum_admin_invitations_role" AS ENUM('admin', 'profesional', 'familia');
  ALTER TABLE "admin_invitations" ALTER COLUMN "role" SET DEFAULT 'admin'::"public"."enum_admin_invitations_role";
  ALTER TABLE "admin_invitations" ALTER COLUMN "role" SET DATA TYPE "public"."enum_admin_invitations_role" USING "role"::"public"."enum_admin_invitations_role";
  DROP INDEX "users_rels_taxonomy_id_idx";
  ALTER TABLE "exports" ALTER COLUMN "collection_slug" SET DEFAULT 'posts';
  ALTER TABLE "imports" ALTER COLUMN "collection_slug" SET DEFAULT 'posts';
  ALTER TABLE "users_rels" DROP COLUMN "taxonomy_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users_role" ALTER COLUMN "value" SET DATA TYPE text;
  UPDATE "users_role" SET "value" = 'user' WHERE "value" NOT IN ('admin', 'user');
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'user');
  ALTER TABLE "users_role" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_role" USING "value"::"public"."enum_users_role";
  ALTER TABLE "admin_invitations" ALTER COLUMN "role" SET DATA TYPE text;
  UPDATE "admin_invitations" SET "role" = 'user' WHERE "role" NOT IN ('admin', 'user');
  ALTER TABLE "admin_invitations" ALTER COLUMN "role" SET DEFAULT 'admin'::text;
  DROP TYPE "public"."enum_admin_invitations_role";
  CREATE TYPE "public"."enum_admin_invitations_role" AS ENUM('admin', 'user');
  ALTER TABLE "admin_invitations" ALTER COLUMN "role" SET DEFAULT 'admin'::"public"."enum_admin_invitations_role";
  ALTER TABLE "admin_invitations" ALTER COLUMN "role" SET DATA TYPE "public"."enum_admin_invitations_role" USING "role"::"public"."enum_admin_invitations_role";
  ALTER TABLE "exports" ALTER COLUMN "collection_slug" DROP DEFAULT;
  ALTER TABLE "imports" ALTER COLUMN "collection_slug" DROP DEFAULT;
  ALTER TABLE "users_rels" ADD COLUMN "taxonomy_id" integer;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_taxonomy_fk" FOREIGN KEY ("taxonomy_id") REFERENCES "public"."taxonomy"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_rels_taxonomy_id_idx" ON "users_rels" USING btree ("taxonomy_id");`)
}
