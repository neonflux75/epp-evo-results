import { NextResponse } from 'next/server';
import db, { ensureSchema } from '@/lib/db';

const filterCache = new Map<string, { data: any; expiresAt: number }>();
let staticCache: { data: any; expiresAt: number } | null = null;
const FILTER_TTL_MS = 60000;
const STATIC_TTL_MS = 180000;
const MAX_FILTER_ENTRIES = 12;
let viewersTableReady = false;

function setFilterCacheBounded(key: string, data: any) {
  const now = Date.now();
  for (const [k, v] of filterCache.entries()) {
    if (now >= v.expiresAt) filterCache.delete(k);
  }
  if (filterCache.size >= MAX_FILTER_ENTRIES) {
    const oldestKey = filterCache.keys().next().value;
    if (oldestKey) filterCache.delete(oldestKey);
  }
  filterCache.set(key, { data, expiresAt: now + FILTER_TTL_MS });
}

async function trackAndCountViewers(viewerId: string | null): Promise<number> {
  try {
    if (!viewersTableReady) {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS active_viewers (
          viewer_id TEXT PRIMARY KEY,
          last_seen BIGINT NOT NULL
        )
      `);
      viewersTableReady = true;
    }

    const now = Date.now();
    if (viewerId && viewerId.length >= 8 && viewerId.length <= 64) {
      await db.execute({
        sql: `
          INSERT INTO active_viewers (viewer_id, last_seen)
          VALUES (?, ?)
          ON CONFLICT (viewer_id) DO UPDATE SET last_seen = EXCLUDED.last_seen
        `,
        args: [viewerId, now]
      });
    }

    const threshold = now - 75000;
    await db.execute({
      sql: 'DELETE FROM active_viewers WHERE last_seen < ?',
      args: [threshold]
    });

    const countRes = await db.execute({
      sql: 'SELECT COUNT(*) as cnt FROM active_viewers WHERE last_seen >= ?',
      args: [threshold]
    });

    const firstRow = countRes.rows.at(0) as any;
    const cnt = Number(firstRow?.cnt || 0);
    return Math.max(cnt, viewerId ? 1 : 0);
  } catch (e) {
    return viewerId ? 1 : 0;
  }
}

async function getStaticDashboardData() {
  const now = Date.now();
  if (staticCache && now < staticCache.expiresAt) {
    return staticCache.data;
  }

  const tracksRes = await db.execute('SELECT DISTINCT track_name FROM laps WHERE is_valid = 1 ORDER BY track_name ASC');

  const sessionsRes = await db.execute(`
    SELECT s.*,
      w.driver_name as winner_name,
      w.car_model as winner_car
    FROM (
      SELECT * FROM sessions
      ORDER BY played_at DESC, id DESC
      LIMIT 45
    ) s
    LEFT JOIN session_results w ON w.session_id = s.id AND w.position = 1
    ORDER BY s.played_at DESC, s.id DESC
  `);

  const trackRecordsRes = await db.execute(`
    SELECT DISTINCT ON (track_name)
      track_name,
      track_layout,
      driver_name,
      nation,
      car_model,
      lap_time_ms as record_ms,
      recorded_at
    FROM laps
    WHERE is_valid = 1 AND lap_time_ms > 0
    ORDER BY track_name ASC, lap_time_ms ASC, id ASC
  `);

  const trackBestSectorsRes = await db.execute(`
    SELECT
      track_name,
      MIN(NULLIF(sector_1_ms, 0)) as best_s1,
      MIN(NULLIF(sector_2_ms, 0)) as best_s2,
      MIN(NULLIF(sector_3_ms, 0)) as best_s3
    FROM laps
    WHERE is_valid = 1 AND lap_time_ms > 0
    GROUP BY track_name
  `);

  const driversRes = await db.execute(`
    WITH DriverStats AS (
      SELECT
        driver_guid,
        MAX(driver_name) as driver_name,
        MAX(nation) as nation,
        COUNT(id) as total_laps,
        SUM(CASE WHEN is_valid = 1 THEN 1 ELSE 0 END) as valid_laps
      FROM laps
      GROUP BY driver_guid
    ),
    DriverBest AS (
      SELECT DISTINCT ON (driver_guid)
        driver_guid,
        lap_time_ms as best_ever_ms,
        recorded_at as best_recorded_at
      FROM laps
      WHERE is_valid = 1 AND lap_time_ms > 0
      ORDER BY driver_guid, lap_time_ms ASC, id ASC
    ),
    DriverWins AS (
      SELECT
        sr.driver_guid,
        COUNT(*) as wins
      FROM session_results sr
      JOIN sessions s ON sr.session_id = s.id
      WHERE sr.position = 1 AND LOWER(s.session_type) LIKE '%race%'
      GROUP BY sr.driver_guid
    )
    SELECT
      ds.driver_guid,
      ds.driver_name,
      ds.nation,
      ds.total_laps,
      ds.valid_laps,
      dbest.best_ever_ms,
      dbest.best_recorded_at,
      COALESCE(dw.wins, 0) as wins
    FROM DriverStats ds
    LEFT JOIN DriverBest dbest ON dbest.driver_guid = ds.driver_guid
    LEFT JOIN DriverWins dw ON dw.driver_guid = ds.driver_guid
    ORDER BY LOWER(TRIM(ds.driver_name)) ASC
  `);

  const data = {
    tracks: tracksRes.rows,
    sessions: sessionsRes.rows,
    trackRecords: trackRecordsRes.rows,
    trackBestSectors: trackBestSectorsRes.rows,
    drivers: driversRes.rows
  };

  staticCache = { data, expiresAt: now + STATIC_TTL_MS };
  return data;
}
export async function GET(request: Request) {
  try {
    await ensureSchema();
    const { searchParams } = new URL(request.url);
    const trackFilter = searchParams.get('track') || 'ALL';
    const carFilter = searchParams.get('car') || 'ALL';
    const lightOnly = searchParams.get('light') === '1';
    const sessionId = searchParams.get('sessionId');
    const eventIdsParam = searchParams.get('eventIds');
    const driverGuid = searchParams.get('driverGuid');
    const viewerId = searchParams.get('viewerId');

    if (!sessionId && !driverGuid) {
      const onlineViewers = await trackAndCountViewers(viewerId);
      const cacheKey = `${trackFilter}::${carFilter}`;
      const cachedFilter = filterCache.get(cacheKey);

      let filteredData: { availableCars: string[]; leaderboard: any[] };
      if (cachedFilter && Date.now() < cachedFilter.expiresAt) {
        filteredData = cachedFilter.data;
      } else {
        const trackOnlyClause = trackFilter !== 'ALL' ? 'AND l.track_name = ?' : '';
        const trackOnlyArgs = trackFilter !== 'ALL' ? [trackFilter] : [];

        const carsRes = await db.execute({
          sql: `
            SELECT DISTINCT l.car_model
            FROM laps l
            WHERE l.is_valid = 1 AND l.lap_time_ms > 0 AND l.car_model IS NOT NULL AND TRIM(l.car_model) != '' ${trackOnlyClause}
            ORDER BY l.car_model ASC
          `,
          args: trackOnlyArgs
        });
        const availableCars = (carsRes.rows as any[]).map((r) => String(r.car_model));

        let filterClause = trackOnlyClause;
        const args: any[] = [...trackOnlyArgs];
        if (carFilter !== 'ALL') {
          filterClause += ' AND l.car_model = ?';
          args.push(carFilter);
        }

        const partitionCols =
          carFilter === 'ALL' ? 'l.driver_guid, l.track_name' : 'l.driver_guid, l.car_model, l.track_name';

        const leaderboardRes = await db.execute({
          sql: `
            WITH RankedLaps AS (
              SELECT
                l.driver_guid,
                l.driver_name,
                l.nation,
                l.car_model,
                l.track_name,
                l.track_layout,
                l.lap_time_ms as best_lap_ms,
                l.sector_1_ms,
                l.sector_2_ms,
                l.sector_3_ms,
                l.recorded_at as last_set,
                ROW_NUMBER() OVER (
                  PARTITION BY ${partitionCols}
                  ORDER BY l.lap_time_ms ASC, l.id ASC
                ) as rn
              FROM laps l
              WHERE l.is_valid = 1 AND l.lap_time_ms > 0 ${filterClause}
            )
            SELECT
              driver_guid,
              driver_name,
              nation,
              car_model,
              track_name,
              track_layout,
              best_lap_ms,
              sector_1_ms,
              sector_2_ms,
              sector_3_ms,
              last_set
            FROM RankedLaps
            WHERE rn = 1
            ORDER BY best_lap_ms ASC
            LIMIT 100
          `,
          args
        });

        filteredData = {
          availableCars,
          leaderboard: leaderboardRes.rows
        };
        setFilterCacheBounded(cacheKey, filteredData);
      }

      if (lightOnly) {
        return NextResponse.json({
          ...filteredData,
          onlineViewers
        });
      }

      let liveServers: any[] = [];
      try {
        const liveRes = await db.execute('SELECT payload, updated_at FROM live_status WHERE id = 1');
        const row = liveRes.rows.at(0) as any;
        if (row) {
          const parsed = JSON.parse(String(row.payload || '[]'));
          const rawUpdated = row.updated_at;
          const updatedMs = typeof rawUpdated === 'number'
            ? rawUpdated
            : Date.parse(String(rawUpdated || ''));
          const isStale = !updatedMs || Number.isNaN(updatedMs) || (Date.now() - updatedMs > 180000);
          liveServers = isStale
            ? parsed.map((s: any) => ({ ...s, online: false, players: 0, sessionPhase: 'OFFLINE', playersList: [] }))
            : parsed;
        }
      } catch (e) {}

      const staticData = await getStaticDashboardData();

      return NextResponse.json({
        liveServers,
        ...staticData,
        ...filteredData,
        onlineViewers
      });
    }
    if (driverGuid) {
      const driverInfoRes = await db.execute({
        sql: `
          SELECT driver_guid, MAX(driver_name) as driver_name, MAX(nation) as nation
          FROM laps
          WHERE driver_guid = ?
          GROUP BY driver_guid
        `,
        args: [driverGuid]
      });
      const driverInfo = driverInfoRes.rows.at(0) || { driver_guid: driverGuid, driver_name: 'Pilota', nation: '' };

      const driverLapsRes = await db.execute({
        sql: `
          WITH AllBestPerTrackCar AS (
            SELECT
              driver_guid,
              car_model,
              track_name,
              MIN(lap_time_ms) as best_lap_ms
            FROM laps
            WHERE is_valid = 1 AND lap_time_ms > 0
            GROUP BY driver_guid, car_model, track_name
          ),
          AllBestOverallTrack AS (
            SELECT
              driver_guid,
              track_name,
              MIN(lap_time_ms) as best_lap_ms
            FROM laps
            WHERE is_valid = 1 AND lap_time_ms > 0
            GROUP BY driver_guid, track_name
          ),
          RankedDriverLaps AS (
            SELECT
              l.driver_guid,
              l.driver_name,
              l.nation,
              l.car_model,
              l.track_name,
              l.track_layout,
              l.lap_time_ms as best_lap_ms,
              l.sector_1_ms,
              l.sector_2_ms,
              l.sector_3_ms,
              l.recorded_at,
              ROW_NUMBER() OVER (
                PARTITION BY l.driver_guid, l.car_model, l.track_name
                ORDER BY l.lap_time_ms ASC, l.id ASC
              ) as rn
            FROM laps l
            WHERE l.driver_guid = ? AND l.is_valid = 1 AND l.lap_time_ms > 0
          )
          SELECT
            r.driver_guid,
            r.driver_name,
            r.nation,
            r.car_model,
            r.track_name,
            r.track_layout,
            r.best_lap_ms,
            r.sector_1_ms,
            r.sector_2_ms,
            r.sector_3_ms,
            r.recorded_at,
            (SELECT MIN(NULLIF(sector_1_ms, 0)) FROM laps WHERE track_name = r.track_name AND is_valid = 1) as track_best_s1,
            (SELECT MIN(NULLIF(sector_2_ms, 0)) FROM laps WHERE track_name = r.track_name AND is_valid = 1) as track_best_s2,
            (SELECT MIN(NULLIF(sector_3_ms, 0)) FROM laps WHERE track_name = r.track_name AND is_valid = 1) as track_best_s3,
            (
              SELECT COUNT(*) + 1
              FROM AllBestOverallTrack o
              WHERE o.track_name = r.track_name AND o.best_lap_ms < r.best_lap_ms
            ) as overall_rank,
            (
              SELECT COUNT(*)
              FROM AllBestOverallTrack o
              WHERE o.track_name = r.track_name
            ) as overall_total,
            (
              SELECT COUNT(*) + 1
              FROM AllBestPerTrackCar c
              WHERE c.track_name = r.track_name AND c.car_model = r.car_model AND c.best_lap_ms < r.best_lap_ms
            ) as car_rank,
            (
              SELECT COUNT(*)
              FROM AllBestPerTrackCar c
              WHERE c.track_name = r.track_name AND c.car_model = r.car_model
            ) as car_total
          FROM RankedDriverLaps r
          WHERE r.rn = 1
          ORDER BY r.track_name ASC, r.best_lap_ms ASC
        `,
        args: [driverGuid]
      });

      return NextResponse.json({
        driver: driverInfo,
        laps: driverLapsRes.rows
      });
    }

    if (sessionId) {
      const sessRes = await db.execute({
        sql: 'SELECT * FROM sessions WHERE id = ?',
        args: [Number(sessionId)]
      });
      const session = sessRes.rows.at(0) as any;

      let relatedSessions: any[] = session ? [session] : [];
      if (session && eventIdsParam) {
        const parsedIds = eventIdsParam
          .split(',')
          .map((x) => Number(x.trim()))
          .filter((n) => Number.isInteger(n) && n > 0)
          .slice(0, 6);
        if (parsedIds.length > 0) {
          const placeholders = parsedIds.map(() => '?').join(',');
          const relRes = await db.execute({
            sql: `SELECT id, session_type, played_at FROM sessions WHERE id IN (${placeholders})`,
            args: parsedIds
          });
          if (relRes.rows.length > 0) {
            relatedSessions = relRes.rows as any[];
          }
        }
      }

      const resultsRes = await db.execute({
        sql: 'SELECT * FROM session_results WHERE session_id = ? ORDER BY position ASC',
        args: [Number(sessionId)]
      });
      const results = resultsRes.rows as any[];

      const lapsRes = await db.execute({
        sql: 'SELECT * FROM laps WHERE session_id = ? ORDER BY id ASC',
        args: [Number(sessionId)]
      });
      const laps = lapsRes.rows;

      let enrichedResults = results;

      if (session && String(session.session_type || '').toLowerCase().includes('race')) {
        const prevQualyRes = await db.execute({
          sql: `
            SELECT id FROM sessions
            WHERE server_name = ?
              AND track_name = ?
              AND LOWER(session_type) LIKE '%qualif%'
              AND (played_at < ? OR (played_at = ? AND id < ?))
            ORDER BY played_at DESC, id DESC
            LIMIT 1
          `,
          args: [session.server_name, session.track_name, session.played_at, session.played_at, session.id]
        });
        const prevQualy = prevQualyRes.rows.at(0) as any;

        const gridMap = new Map<string, number>();
        if (prevQualy) {
          const qualyResultsRes = await db.execute({
            sql: 'SELECT driver_guid, position FROM session_results WHERE session_id = ? ORDER BY position ASC',
            args: [prevQualy.id]
          });
          for (const qr of qualyResultsRes.rows as any[]) {
            gridMap.set(String(qr.driver_guid), Number(qr.position));
          }
        }

        enrichedResults = results.map((r: any) => ({
          ...r,
          grid_position: gridMap.has(String(r.driver_guid)) ? gridMap.get(String(r.driver_guid)) : (r.grid_position ?? null)
        }));
      }

      return NextResponse.json({ session, relatedSessions, results: enrichedResults, laps });
    }

    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  } catch (err) {
    console.error('Errore API Dashboard PostgreSQL:', err);
    return NextResponse.json({ error: 'Errore connessione database PostgreSQL' }, { status: 500 });
  }
}
