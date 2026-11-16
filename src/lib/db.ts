import { createClient, Client } from '@libsql/client';

let client: Client | null = null;

export function getDb(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) {
      throw new Error('TURSO_DATABASE_URL non configurato nelle variabili d ambiente');
    }
    client = createClient({
      url,
      authToken,
    });
  }
  return client;
}

const db = {
  execute: (...args: Parameters<Client['execute']>) => getDb().execute(...args),
  batch: (...args: Parameters<Client['batch']>) => getDb().batch(...args),
};

export default db;

let schemaInitialized = false;

export async function ensureSchema() {
  if (schemaInitialized) return;
  const conn = getDb();

  await conn.batch([
    `CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_name TEXT UNIQUE,
      server_name TEXT,
      track_name TEXT,
      session_type TEXT,
      date_time TEXT,
      winner_name TEXT,
      winner_car TEXT,
      total_drivers INTEGER
    )`,
    `CREATE TABLE IF NOT EXISTS session_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER,
      position INTEGER,
      driver_name TEXT,
      driver_guid TEXT,
      nation TEXT,
      car_model TEXT,
      best_lap_ms INTEGER,
      total_time_ms INTEGER,
      laps_count INTEGER,
      grid_position INTEGER,
      FOREIGN KEY(session_id) REFERENCES sessions(id)
    )`,
    `CREATE TABLE IF NOT EXISTS laps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER,
      driver_name TEXT,
      driver_guid TEXT,
      nation TEXT,
      car_model TEXT,
      track_name TEXT,
      lap_time_ms INTEGER,
      sector1_ms INTEGER,
      sector2_ms INTEGER,
      sector3_ms INTEGER,
      cuts INTEGER,
      timestamp TEXT,
      FOREIGN KEY(session_id) REFERENCES sessions(id)
    )`,
    `CREATE TABLE IF NOT EXISTS live_status (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      payload TEXT,
      updated_at INTEGER
    )`
  ], 'write');

  schemaInitialized = true;
}
