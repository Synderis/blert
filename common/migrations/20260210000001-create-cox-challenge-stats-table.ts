import { Sql } from 'postgres';

export async function migrate(sql: Sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS cox_challenge_stats (
      id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      challenge_id INT NOT NULL REFERENCES challenges (id) ON DELETE CASCADE,
      tekton_deaths INT DEFAULT 0,
      crabs_deaths INT DEFAULT 0,
      ice_demon_deaths INT DEFAULT 0,
      shamans_deaths INT DEFAULT 0,
      vanguards_deaths INT DEFAULT 0,
      thieving_deaths INT DEFAULT 0,
      vespula_deaths INT DEFAULT 0,
      tightrope_deaths INT DEFAULT 0,
      guardians_deaths INT DEFAULT 0,
      vasa_deaths INT DEFAULT 0,
      mystics_deaths INT DEFAULT 0,
      muttadiles_deaths INT DEFAULT 0,
      olm_deaths INT DEFAULT 0
    )
  `;
}
