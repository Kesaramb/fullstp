import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_site_settings_theme_font_pairing" ADD VALUE IF NOT EXISTS 'playfair-inter';

    ALTER TABLE "footer"
      ADD COLUMN "phone" varchar,
      ADD COLUMN "address" varchar,
      ADD COLUMN "business_hours" varchar,
      ADD COLUMN "map_link" varchar;

    ALTER TABLE "site_settings"
      ADD COLUMN "og_image_id" integer;

    ALTER TABLE "site_settings"
      ADD CONSTRAINT "site_settings_og_image_id_media_id_fk"
      FOREIGN KEY ("og_image_id")
      REFERENCES "public"."media"("id")
      ON DELETE set null
      ON UPDATE no action;

    CREATE INDEX "site_settings_og_image_idx" ON "site_settings" USING btree ("og_image_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "site_settings_og_image_idx";
    ALTER TABLE "site_settings" DROP CONSTRAINT IF EXISTS "site_settings_og_image_id_media_id_fk";
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "og_image_id";

    ALTER TABLE "footer"
      DROP COLUMN IF EXISTS "phone",
      DROP COLUMN IF EXISTS "address",
      DROP COLUMN IF EXISTS "business_hours",
      DROP COLUMN IF EXISTS "map_link";
  `)
}
