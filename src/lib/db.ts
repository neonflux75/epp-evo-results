import { Pool } from 'pg';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const rawUrl = process.env.DATABASE_URL;
    if (!rawUrl) {
      throw new Error('DATABASE_URL non configurato nelle variabili d ambiente');
    }
    const cleanUrl = rawUrl.replace(/([?&])sslmode=[^&]*(&|$)/, '$1').replace(/[?&]$/, '');
    pool = new Pool({
      connectionString: cleanUrl,
      ssl: { rejectUnauthorized: false },
      max: 1,
      idleTimeoutMillis: 15000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

function convertPlaceholders(sql: string): string {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

export type QueryInput = string | { sql: string; args?: any[] };

const db = {
  async execute(input: QueryInput) {
    const p = getPool();
    if (typeof input === 'string') {
      const res = await p.query(input);
      return { rows: res.rows, rowCount: res.rowCount ?? 0 };
    }
    const pgSql = convertPlaceholders(input.sql);
    const res = await p.query(pgSql, input.args || []);
    return { rows: res.rows, rowCount: res.rowCount ?? 0 };
  },
};

export default db;

let schemaInitialized = false;

export async function ensureSchema() {
  if (schemaInitialized) return;
  const p = getPool();

  await p.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      file_hash TEXT UNIQUE,
      filename TEXT,
      server_name TEXT,
      session_name TEXT,
      session_type TEXT,
      track_name TEXT,
      track_layout TEXT,
      played_at TEXT,
      driver_count INTEGER
    );

    CREATE TABLE IF NOT EXISTS session_results (
      id SERIAL PRIMARY KEY,
      session_id INTEGER,
      position INTEGER,
      driver_guid TEXT,
      driver_name TEXT,
      nickname TEXT,
      nation TEXT,
      car_model TEXT,
      race_number INTEGER,
      total_time_ms BIGINT,
      best_lap_ms BIGINT,
      laps_completed INTEGER
    );

    CREATE TABLE IF NOT EXISTS laps (
      id SERIAL PRIMARY KEY,
      session_id INTEGER,
      driver_guid TEXT,
      driver_name TEXT,
      nation TEXT,
      car_model TEXT,
      track_name TEXT,
      track_layout TEXT,
      lap_time_ms BIGINT,
      sector_1_ms BIGINT,
      sector_2_ms BIGINT,
      sector_3_ms BIGINT,
      is_valid INTEGER,
      recorded_at TEXT
    );

    CREATE TABLE IF NOT EXISTS live_status (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_laps_track_valid ON laps(track_name, is_valid, lap_time_ms);
    CREATE INDEX IF NOT EXISTS idx_laps_track_car_valid ON laps(track_name, car_model, is_valid, lap_time_ms);
    CREATE INDEX IF NOT EXISTS idx_laps_driver ON laps(driver_guid);
    CREATE INDEX IF NOT EXISTS idx_laps_session ON laps(session_id);
    CREATE INDEX IF NOT EXISTS idx_session_results_session ON session_results(session_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_played_at ON sessions(played_at DESC, id DESC);
  `);

  schemaInitialized = true;
}
