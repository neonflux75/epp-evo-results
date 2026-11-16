import { createClient, Client } from '@libsql/client';

let _client: Client | null = null;
let _schemaReady: Promise<void> | null = null;

export function getDb(): Client {
  if (_client) return _client;

  const url = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

  if (!url) {
    throw new Error('Variabile d\'ambiente TURSO_DATABASE_URL mancante.');
  }

  _client = createClient({
    url,
    authToken: authToken || undefined,
  });

  return _client;
}

export async function ensureSchema(): Promise<void> {
  if (_schemaReady) return _schemaReady;

  _schemaReady = (async () => {
    const db = getDb();
    await db.batch(
      [
        `CREATE TABLE IF NOT EXISTS sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          file_hash TEXT UNIQUE,
          filename TEXT,
          server_name TEXT,
          session_name TEXT,
          session_type TEXT,
          track_name TEXT,
          track_layout TEXT,
          played_at TEXT,
          driver_count INTEGER
        )`,
        `CREATE TABLE IF NOT EXISTS session_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id INTEGER,
          position INTEGER,
          driver_guid TEXT,
          driver_name TEXT,
          nickname TEXT,
          nation TEXT,
          car_model TEXT,
          race_number INTEGER,
          total_time_ms INTEGER,
          best_lap_ms INTEGER,
          laps_completed INTEGER,
          FOREIGN KEY(session_id) REFERENCES sessions(id)
        )`,
        `CREATE TABLE IF NOT EXISTS laps (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          session_id INTEGER,
          driver_guid TEXT,
          driver_name TEXT,
          nation TEXT,
          car_model TEXT,
          track_name TEXT,
          track_layout TEXT,
          lap_time_ms INTEGER,
          sector_1_ms INTEGER,
          sector_2_ms INTEGER,
          sector_3_ms INTEGER,
          is_valid INTEGER,
          recorded_at TEXT,
          FOREIGN KEY(session_id) REFERENCES sessions(id)
        )`,
        `CREATE TABLE IF NOT EXISTS live_status (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          payload TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        )`,
        `CREATE INDEX IF NOT EXISTS idx_laps_track_valid ON laps(track_name, is_valid, lap_time_ms)`,
        `CREATE INDEX IF NOT EXISTS idx_laps_driver ON laps(driver_guid)`,
      ],
      'write'
    );
  })();

  return _schemaReady;
}
