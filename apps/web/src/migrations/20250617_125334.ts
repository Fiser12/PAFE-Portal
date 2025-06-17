import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE IF NOT EXISTS "reservation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"item_id" integer NOT NULL,
  	"user_id" varchar NOT NULL,
  	"reservation_date" timestamp(3) with time zone NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "catalog_item" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"cover_id" integer NOT NULL,
  	"title" varchar NOT NULL,
  	"content" jsonb NOT NULL,
  	"quantity" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS "catalog_item_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"taxonomy_id" integer
  );
  
  CREATE TABLE IF NOT EXISTS "pages_blocks_catalog_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE IF NOT EXISTS "_pages_v_blocks_catalog_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "users_rels" ADD COLUMN "reservation_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "reservation_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "catalog_item_id" integer;
  DO $$ BEGIN
   ALTER TABLE "reservation" ADD CONSTRAINT "reservation_item_id_catalog_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."catalog_item"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "reservation" ADD CONSTRAINT "reservation_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "catalog_item" ADD CONSTRAINT "catalog_item_cover_id_media_id_fk" FOREIGN KEY ("cover_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "catalog_item_rels" ADD CONSTRAINT "catalog_item_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."catalog_item"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "catalog_item_rels" ADD CONSTRAINT "catalog_item_rels_taxonomy_fk" FOREIGN KEY ("taxonomy_id") REFERENCES "public"."taxonomy"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "pages_blocks_catalog_list" ADD CONSTRAINT "pages_blocks_catalog_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "_pages_v_blocks_catalog_list" ADD CONSTRAINT "_pages_v_blocks_catalog_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "reservation_item_idx" ON "reservation" USING btree ("item_id");
  CREATE INDEX IF NOT EXISTS "reservation_user_idx" ON "reservation" USING btree ("user_id");
  CREATE INDEX IF NOT EXISTS "reservation_updated_at_idx" ON "reservation" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "reservation_created_at_idx" ON "reservation" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "catalog_item_cover_idx" ON "catalog_item" USING btree ("cover_id");
  CREATE INDEX IF NOT EXISTS "catalog_item_updated_at_idx" ON "catalog_item" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "catalog_item_created_at_idx" ON "catalog_item" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "catalog_item_rels_order_idx" ON "catalog_item_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "catalog_item_rels_parent_idx" ON "catalog_item_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "catalog_item_rels_path_idx" ON "catalog_item_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "catalog_item_rels_taxonomy_id_idx" ON "catalog_item_rels" USING btree ("taxonomy_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_catalog_list_order_idx" ON "pages_blocks_catalog_list" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_catalog_list_parent_id_idx" ON "pages_blocks_catalog_list" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_catalog_list_path_idx" ON "pages_blocks_catalog_list" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_catalog_list_order_idx" ON "_pages_v_blocks_catalog_list" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_catalog_list_parent_id_idx" ON "_pages_v_blocks_catalog_list" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_catalog_list_path_idx" ON "_pages_v_blocks_catalog_list" USING btree ("_path");
  DO $$ BEGIN
   ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_reservation_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservation"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reservation_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservation"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  DO $$ BEGIN
   ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_catalog_item_fk" FOREIGN KEY ("catalog_item_id") REFERENCES "public"."catalog_item"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION
   WHEN duplicate_object THEN null;
  END $$;
  
  CREATE INDEX IF NOT EXISTS "users_rels_reservation_id_idx" ON "users_rels" USING btree ("reservation_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_reservation_id_idx" ON "payload_locked_documents_rels" USING btree ("reservation_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_catalog_item_id_idx" ON "payload_locked_documents_rels" USING btree ("catalog_item_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "reservation" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "catalog_item" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "catalog_item_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_catalog_list" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_catalog_list" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "reservation" CASCADE;
  DROP TABLE "catalog_item" CASCADE;
  DROP TABLE "catalog_item_rels" CASCADE;
  DROP TABLE "pages_blocks_catalog_list" CASCADE;
  DROP TABLE "_pages_v_blocks_catalog_list" CASCADE;
  ALTER TABLE "users_rels" DROP CONSTRAINT "users_rels_reservation_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_reservation_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_catalog_item_fk";
  
  DROP INDEX IF EXISTS "users_rels_reservation_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_reservation_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_catalog_item_id_idx";
  ALTER TABLE "users_rels" DROP COLUMN IF EXISTS "reservation_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "reservation_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "catalog_item_id";`)
}
