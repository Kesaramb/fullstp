import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

/**
 * Add new Hero variants and FeatureGrid variant column for the 2027 design refresh.
 *
 * - Extends enum_pages_blocks_hero_variant + version twin with: editorialAsymmetric, bentoSplit, gradientMeshSpotlight
 * - Creates enum_pages_blocks_feature_grid_variant + version twin with: default, bentoAsymmetric, numberedRail, glassmorphicCards
 * - Adds the `variant` column to pages_blocks_feature_grid + version twin, default 'default'
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Hero variants — extend existing enums (idempotent)
  await db.execute(sql`ALTER TYPE "public"."enum_pages_blocks_hero_variant" ADD VALUE IF NOT EXISTS 'editorialAsymmetric'`)
  await db.execute(sql`ALTER TYPE "public"."enum_pages_blocks_hero_variant" ADD VALUE IF NOT EXISTS 'bentoSplit'`)
  await db.execute(sql`ALTER TYPE "public"."enum_pages_blocks_hero_variant" ADD VALUE IF NOT EXISTS 'gradientMeshSpotlight'`)
  await db.execute(sql`ALTER TYPE "public"."enum__pages_v_blocks_hero_variant" ADD VALUE IF NOT EXISTS 'editorialAsymmetric'`)
  await db.execute(sql`ALTER TYPE "public"."enum__pages_v_blocks_hero_variant" ADD VALUE IF NOT EXISTS 'bentoSplit'`)
  await db.execute(sql`ALTER TYPE "public"."enum__pages_v_blocks_hero_variant" ADD VALUE IF NOT EXISTS 'gradientMeshSpotlight'`)

  // FeatureGrid variant — new enums + new column
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_pages_blocks_feature_grid_variant" AS ENUM('default', 'bentoAsymmetric', 'numberedRail', 'glassmorphicCards');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum__pages_v_blocks_feature_grid_variant" AS ENUM('default', 'bentoAsymmetric', 'numberedRail', 'glassmorphicCards');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `)
  await db.execute(sql`
    ALTER TABLE "pages_blocks_feature_grid"
      ADD COLUMN IF NOT EXISTS "variant" "public"."enum_pages_blocks_feature_grid_variant" DEFAULT 'default';
  `)
  await db.execute(sql`
    ALTER TABLE "_pages_v_blocks_feature_grid"
      ADD COLUMN IF NOT EXISTS "variant" "public"."enum__pages_v_blocks_feature_grid_variant" DEFAULT 'default';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Drop column then type. Note: enum values added by ADD VALUE cannot be removed
  // in Postgres without recreating the type, so the Hero enum extensions stay.
  await db.execute(sql`ALTER TABLE "pages_blocks_feature_grid" DROP COLUMN IF EXISTS "variant"`)
  await db.execute(sql`ALTER TABLE "_pages_v_blocks_feature_grid" DROP COLUMN IF EXISTS "variant"`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum_pages_blocks_feature_grid_variant"`)
  await db.execute(sql`DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_feature_grid_variant"`)
}
