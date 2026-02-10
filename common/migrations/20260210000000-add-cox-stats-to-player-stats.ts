import { Sql } from 'postgres';

export async function migrate(sql: Sql) {
  await sql`
    ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS cox_completions INT DEFAULT 0;
  `;
  await sql`
    ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS cox_wipes INT DEFAULT 0;
  `;
  await sql`
    ALTER TABLE player_stats ADD COLUMN IF NOT EXISTS cox_resets INT DEFAULT 0;
  `;
}
