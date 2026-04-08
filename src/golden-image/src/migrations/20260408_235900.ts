import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "footer"
      ALTER COLUMN "copyright"
      SET DEFAULT ('© ' || EXTRACT(YEAR FROM CURRENT_DATE)::text || ' All rights reserved.');
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "footer"
      ALTER COLUMN "copyright"
      SET DEFAULT '© 2026 All rights reserved.';
  `)
}
