require('dotenv').config();
const fs = require('fs');
const path = require('path');
const ini = require('ini');
const { Pool } = require('pg');

const config = ini.parse(fs.readFileSync(path.join(__dirname, 'config.ini'), 'utf-8'));
const SERVERS_ROOT = config.servers_root || (config.paths && config.paths.servers_root);
const POLL_MS = Math.max(parseInt(config.poll_interval_seconds || (config.settings && config.settings.poll_interval_seconds), 10) || 30, 15) * 1000;

const rawDbUrl = process.env.DATABASE_URL;
if (!rawDbUrl) {
  console.error('[ERRORE CRITICO] Variabile DATABASE_URL mancante nel file .env!');
  process.exit(1);
}

const cleanDbUrl = rawDbUrl.replace(/([?&])sslmode=[^&]*(&|$)/, '$1').replace(/[?&]$/, '');

const pool = new Pool({
  connectionString: cleanDbUrl,
  ssl: { rejectUnauthorized: false },
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

async function initDb() {
  await pool.query(`
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
    CREATE INDEX IF NOT EXISTS idx_laps_driver ON laps(driver_guid);
    CREATE INDEX IF NOT EXISTS idx_session_results_session ON session_results(session_id);
  `);
}

const nationCache = new Map();

async function lookupDriverNation(name) {
  if (!name) return '';
  const cleanKey = name.trim().toLowerCase();
  if (nationCache.has(cleanKey)) {
    return nationCache.get(cleanKey);
  }
  try {
    const res = await pool.query(
      `SELECT nation FROM laps
       WHERE LOWER(TRIM(driver_name)) = $1 AND nation IS NOT NULL AND TRIM(nation) != ''
       ORDER BY id DESC LIMIT 1`,
      [cleanKey]
    );
    const nat = res.rows.length > 0 ? String(res.rows[0].nation || '') : '';
    if (nat) nationCache.set(cleanKey, nat);
    return nat;
  } catch (e) {
    return '';
  }
}

function parseDateFromFilename(filename, fallbackDate) {
  const m = filename.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
  if (m) {
    return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}:${m[6]}`;
  }
  return fallbackDate;
}

function formatCarName(rawCar) {
  if (!rawCar) return 'GT3';
  return rawCar
    .replace(/^ks_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

const processedHashes = new Set();

async function preloadProcessedHashes() {
  try {
    const res = await pool.query('SELECT file_hash FROM sessions');
    for (const row of res.rows) {
      if (row.file_hash) processedHashes.add(row.file_hash);
    }
    console.log(`Caricate ${processedHashes.size} sessioni già presenti su Aiven PostgreSQL.`);
  } catch (e) {}
}

async function processResultFile(filePath, serverFolder) {
  const filename = path.basename(filePath);
  const fileHash = `${serverFolder}_${filename}`;

  if (processedHashes.has(fileHash)) return;

  const client = await pool.connect();
  try {
    const checkRes = await client.query('SELECT id FROM sessions WHERE file_hash = $1', [fileHash]);
    if (checkRes.rows.length > 0) {
      processedHashes.add(fileHash);
      return;
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(raw);

    if (!data.laps || data.laps.length === 0) {
      processedHashes.add(fileHash);
      return;
    }

    const stats = fs.statSync(filePath);
    const playedAt = parseDateFromFilename(filename, stats.mtime.toISOString().replace('T', ' ').substring(0, 19));

    const driversMap = new Map();
    (data.drivers || []).forEach(d => {
      const key = `${d.guid.a}_${d.guid.b}`;
      const fullName = `${d.first_name || ''} ${d.last_name || ''}`.trim() || d.nickname || 'Sconosciuto';
      driversMap.set(key, {
        guid: key,
        name: fullName,
        nickname: d.nickname || '',
        nation: d.nation || ''
      });
      if (d.nation) {
        nationCache.set(fullName.toLowerCase(), d.nation);
      }
    });

    const carsMap = new Map();
    (data.cars || []).forEach(c => {
      const key = `${c.car_id.a}_${c.car_id.b}`;
      carsMap.set(key, {
        model: c.model_displayname || 'Auto Sconosciuta',
        number: c.race_number || 0
      });
    });

    await client.query('BEGIN');

    const insertSessRes = await client.query(
      `INSERT INTO sessions (file_hash, filename, server_name, session_name, session_type, track_name, track_layout, played_at, driver_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        fileHash,
        filename,
        data.server_name || serverFolder,
        data.session_name || '',
        data.session_type || 'Practice',
        data.track_name || 'Sconosciuta',
        data.track_layout_name || '',
        playedAt,
        (data.drivers || []).length
      ]
    );

    const sessionId = Number(insertSessRes.rows[0].id);

    const driverBestLap = new Map();
    const driverLapCount = new Map();
    const driverCar = new Map();

    for (const lap of data.laps) {
      const dKey = `${lap.driver_key.a}_${lap.driver_key.b}`;
      const cKey = `${lap.car_key.a}_${lap.car_key.b}`;
      const driver = driversMap.get(dKey) || { guid: dKey, name: 'Pilota', nation: '' };
      const car = carsMap.get(cKey) || { model: 'GT3', number: 0 };

      const isValid = lap.flags === 2 ? 1 : 0;
      const splits = Array.isArray(lap.split) ? lap.split : [];

      driverCar.set(dKey, car);
      driverLapCount.set(dKey, (driverLapCount.get(dKey) || 0) + 1);

      if (isValid && lap.time > 0) {
        const prevBest = driverBestLap.get(dKey);
        if (!prevBest || lap.time < prevBest) {
          driverBestLap.set(dKey, lap.time);
        }
      }

      await client.query(
        `INSERT INTO laps (session_id, driver_guid, driver_name, nation, car_model, track_name, track_layout, lap_time_ms, sector_1_ms, sector_2_ms, sector_3_ms, is_valid, recorded_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          sessionId,
          dKey,
          driver.name,
          driver.nation,
          car.model,
          data.track_name || 'Sconosciuta',
          data.track_layout_name || '',
          lap.time,
          splits[0] || 0,
          splits[1] || 0,
          splits[2] || 0,
          isValid,
          playedAt
        ]
      );
    }

    const standings = data.driver_standings || [];
    const times = data.time_standings || [];

    for (let idx = 0; idx < standings.length; idx++) {
      const st = standings[idx];
      const dKey = `${st.a}_${st.b}`;
      const driver = driversMap.get(dKey);
      if (!driver) continue;
      const car = driverCar.get(dKey) || { model: '-', number: 0 };
      const lapsDone = driverLapCount.get(dKey) || 0;
      const bestLap = driverBestLap.get(dKey) || 0;

      if (lapsDone > 0) {
        await client.query(
          `INSERT INTO session_results (session_id, position, driver_guid, driver_name, nickname, nation, car_model, race_number, total_time_ms, best_lap_ms, laps_completed)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            sessionId,
            idx + 1,
            dKey,
            driver.name,
            driver.nickname,
            driver.nation,
            car.model,
            car.number,
            times[idx] || 0,
            bestLap,
            lapsDone
          ]
        );
      }
    }

    await client.query('COMMIT');
    processedHashes.add(fileHash);
    console.log(`[AIVEN IMPORTATO] ${serverFolder} -> ${filename} (${data.track_name} - ${data.session_type})`);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error(`[ERRORE] Lettura/Invio ${filename}:`, err.message);
  } finally {
    client.release();
  }
}

async function parseLiveLog(logPath, isRaceWeekend) {
  let currentPlayers = 0;
  let sessionPhase = isRaceWeekend ? 'QUALIFICHE' : 'PRATICA';
  const activeDrivers = new Map();

  try {
    const stat = fs.statSync(logPath);
    const readSize = Math.min(stat.size, 500000);
    const fd = fs.openSync(logPath, 'r');
    const buffer = Buffer.alloc(readSize);
    fs.readSync(fd, buffer, 0, readSize, stat.size - readSize);
    fs.closeSync(fd);

    const content = buffer.toString('utf-8');
    const lines = content.split(/\r?\n/);

    for (const line of lines) {
      if (line.includes('TimeAttackRemote Qualifying created')) {
        sessionPhase = isRaceWeekend ? 'QUALIFICHE' : 'PRATICA';
      } else if (line.includes('InstantRaceRemote Race created')) {
        sessionPhase = 'GARA';
      }

      const updMatch = line.match(/Server updated:\s*(\d+)\s*players/);
      if (updMatch) {
        currentPlayers = parseInt(updMatch[1], 10);
      }

      const natMatch = line.match(/(\d{17})[^A-Za-z0-9]+(?:nation|country)[=:\s]+"?([A-Za-z]{2,3})"?/i);
      if (natMatch) {
        const [, steamId, nat] = natMatch;
        const existing = activeDrivers.get(steamId) || { steamId, number: '-', name: 'Pilota', car: 'In pista' };
        existing.nation = nat.toUpperCase();
        activeDrivers.set(steamId, existing);
      }

      const carCreateMatch = line.match(/Car \[([^\]]+)\] #(\d+) for driver (.+?) \[(\d+)\]/);
      if (carCreateMatch) {
        const [, carId, number, rawName, steamId] = carCreateMatch;
        const cleanName = rawName.trim();
        const existing = activeDrivers.get(steamId) || {};
        activeDrivers.set(steamId, {
          steamId,
          carId,
          number,
          name: cleanName,
          car: existing.car || 'In pista',
          nation: existing.nation || ''
        });
      }

      const connCarMatch = line.match(/(\d{17}) connected \(true\) on car ([^,]+), with new carId ([^\s]+)/);
      if (connCarMatch) {
        const [, steamId, rawCar, carId] = connCarMatch;
        const existing = activeDrivers.get(steamId) || { steamId, number: '-', name: 'Pilota' };
        existing.car = formatCarName(rawCar);
        existing.carId = carId;
        activeDrivers.set(steamId, existing);
      }

      const destroyMatch = line.match(/Destroying Car\(\d+\) By ConnectionID \(.+?\s+(\d{17})\)/);
      if (destroyMatch) {
        activeDrivers.delete(destroyMatch[1]);
      }

      const discMatch = line.match(/(\d{17})\s+(?:disconnected|timed out)/i);
      if (discMatch) {
        activeDrivers.delete(discMatch[1]);
      }
    }

    if (currentPlayers === 0) {
      activeDrivers.clear();
    } else if (activeDrivers.size > currentPlayers) {
      const entries = Array.from(activeDrivers.entries());
      const trimmed = entries.slice(entries.length - currentPlayers);
      activeDrivers.clear();
      for (const [k, v] of trimmed) {
        activeDrivers.set(k, v);
      }
    }
  } catch (e) {}

  const playersList = [];
  for (const p of activeDrivers.values()) {
    const nat = p.nation || (await lookupDriverNation(p.name));
    playersList.push({ ...p, nation: nat });
  }

  return {
    currentPlayers: playersList.length,
    sessionPhase,
    playersList
  };
}

let isScanning = false;
let lastLiveJson = '';

async function scanServers() {
  if (isScanning) return;
  isScanning = true;

  try {
    if (!fs.existsSync(SERVERS_ROOT)) {
      console.log('Cartella server non trovata:', SERVERS_ROOT);
      return;
    }

    const folders = fs.readdirSync(SERVERS_ROOT).filter(f =>
      fs.statSync(path.join(SERVERS_ROOT, f)).isDirectory()
    );

    const liveStatus = [];

    for (const folder of folders) {
      const serverDir = path.join(SERVERS_ROOT, folder);

      for (const resName of ['Results', 'result']) {
        const resDir = path.join(serverDir, resName);
        if (fs.existsSync(resDir)) {
          const files = fs.readdirSync(resDir).filter(f => f.endsWith('.json'));
          for (const file of files) {
            await processResultFile(path.join(resDir, file), folder);
          }
        }
      }

      let serverName = folder;
      let maxPlayers = 20;
      let track = '';
      let trackId = '';
      let trackLayout = '';
      let isRaceWeekend = false;

      const serverJsonPath = path.join(serverDir, 'server.json');
      if (fs.existsSync(serverJsonPath)) {
        try {
          const sConf = JSON.parse(fs.readFileSync(serverJsonPath, 'utf-8'));
          if (sConf.name) serverName = sConf.name;
          else if (sConf.server_name) serverName = sConf.server_name;
          if (sConf.max_players) maxPlayers = sConf.max_players;
          if (sConf.track) {
            trackId = sConf.track;
            trackLayout = sConf.layout || '';
            track = sConf.layout ? `${sConf.track} (${sConf.layout})` : sConf.track;
          }
          if (sConf.game_type && sConf.game_type.includes('RACE')) {
            isRaceWeekend = true;
          }
        } catch (e) {}
      }

      let isOnline = false;
      let logData = { currentPlayers: 0, sessionPhase: isRaceWeekend ? 'QUALIFICHE' : 'PRATICA', playersList: [] };
      const logsDir = path.join(serverDir, 'Logs');

      if (fs.existsSync(logsDir)) {
        const logFiles = fs.readdirSync(logsDir)
          .filter(f => f.endsWith('.txt') || f.endsWith('.log'))
          .map(f => ({ name: f, time: fs.statSync(path.join(logsDir, f)).mtime.getTime() }))
          .sort((a, b) => b.time - a.time);

        if (logFiles.length > 0) {
          const latestLog = path.join(logsDir, logFiles[0].name);
          const stat = fs.statSync(latestLog);
          isOnline = (Date.now() - stat.mtime.getTime()) < 180000;
          if (isOnline) {
            logData = await parseLiveLog(latestLog, isRaceWeekend);
          }
        }
      }

      const finalCount = isOnline ? logData.playersList.length : 0;

      liveStatus.push({
        id: folder,
        name: serverName,
        online: isOnline,
        players: finalCount,
        maxPlayers,
        track,
        trackId,
        trackLayout,
        sessionPhase: isOnline ? logData.sessionPhase : 'OFFLINE',
        playersList: isOnline ? logData.playersList : []
      });
    }

    const serialized = JSON.stringify(liveStatus, null, 2);
    fs.writeFileSync(path.join(__dirname, 'live_status.json'), serialized);

    const nowIso = new Date().toISOString();
    const shouldPush = serialized !== lastLiveJson || (Date.now() - (scanServers.lastHeartbeat || 0)) > 45000;
    if (shouldPush) {
      await pool.query(
        `INSERT INTO live_status (id, payload, updated_at)
         VALUES (1, $1, $2)
         ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = EXCLUDED.updated_at`,
        [JSON.stringify(liveStatus), nowIso]
      );
      lastLiveJson = serialized;
      scanServers.lastHeartbeat = Date.now();
    }
  } catch (err) {
    console.error('[ERRORE SCAN]', err.message);
  } finally {
    isScanning = false;
  }
}

(async () => {
  try {
    console.log('Connessione al database cloud Aiven PostgreSQL in corso...');
    await initDb();
    await preloadProcessedHashes();
    console.log(`Connesso a Aiven PostgreSQL! Avvio monitoraggio server Assetto Corsa EVO (ogni ${POLL_MS / 1000}s)...`);
    await scanServers();
    setInterval(scanServers, POLL_MS);
  } catch (err) {
    console.error('[ERRORE AVVIO AIVEN]', err.message);
    process.exit(1);
  }
})();
