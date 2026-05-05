import { Sql } from 'postgres';

export async function migrate(sql: Sql) {
  await sql`
    ALTER TABLE cox_challenge_stats
    RENAME COLUMN muttadiles_deaths TO muttadile_deaths
  `;
}
