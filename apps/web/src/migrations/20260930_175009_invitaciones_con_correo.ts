import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "admin_invitations" ADD COLUMN "email" varchar;
  CREATE INDEX "admin_invitations_email_idx" ON "admin_invitations" USING btree ("email");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "admin_invitations_email_idx";
  ALTER TABLE "admin_invitations" DROP COLUMN "email";`)
}
