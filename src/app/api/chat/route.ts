import { NextResponse } from 'next/server';
import db, { ensureSchema } from '@/lib/db';

//export const dynamic = 'force-dynamic';

function formatMs(ms: number): string {
  if (!ms || ms <= 0) return '--:--.---';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${minutes}:${seconds.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
}

function formatGap(ms: number, bestMs: number): string {
  if (!ms || !bestMs || ms <= bestMs) return 'Leader';
  const diff = (ms - bestMs) / 1000;
  return `+${diff.toFixed(3)}s`;
}

export async function POST(request: Request) {
  try {
    await ensureSchema();
    const body = await request.json();
    const message = (body.message || '').trim();

    if (!message) {
      return NextResponse.json({
        reply: 'Scrivi il tuo nome o cognome (es. "Mario Rossi" oppure "Posizione Rossi") per conoscere la tua posizione e i tuoi tempi migliori.'
      });
    }

    const tracksRes = await db.execute('SELECT DISTINCT track_name FROM laps WHERE is_valid = 1');
    const tracksRows = tracksRes.rows as unknown as { track_name: string }[];
    const lowerMsg = message.toLowerCase();

    let matchedTrack: string | null = null;
    for (const t of tracksRows) {
      const tLow = String(t.track_name || '').toLowerCase();
      const shortName = tLow.replace(/^ks_/, '').replace(/_/g, ' ');
      if (lowerMsg.includes(tLow) || (shortName.length > 3 && lowerMsg.includes(shortName))) {
        matchedTrack = String(t.track_name);
        break;
      }
    }

    const stopWords = [
      'ciao', 'salve', 'hey', 'bot', 'dimmi', 'quale', 'qual', 'è', 'la', 'mia', 'il', 'mio',
      'posizione', 'classifica', 'tempo', 'tempi', 'giro', 'veloce', 'migliore', 'best', 'lap',
      'record', 'su', 'a', 'in', 'di', 'del', 'della', 'per', 'che', 'ha', 'fatto', 'sono',
      'quanto', 'sto', 'pista', 'circuito', 'giri', 'veloci', 'nel', 'sito', 'stats', 'statistiche'
    ];

    let tokens = lowerMsg
      .replace(/[?!.,;:"'()]/g, ' ')
      .split(/\s+/)
      .filter((w: string) => w.length >= 2 && !stopWords.includes(w));

    if (matchedTrack) {
      const trackWords = matchedTrack.toLowerCase().replace(/^ks_/, '').split(/[\s_]+/);
      tokens = tokens.filter((w: string) => !trackWords.includes(w));
    }

    if (tokens.length === 0) {
      return NextResponse.json({
        reply: 'Non ho capito il nome del pilota. Scrivi direttamente il nome o il cognome (es. "Rossi")!'
      });
    }

    const allDriversRes = await db.execute(`
      SELECT DISTINCT driver_guid, driver_name, nation
      FROM laps
      WHERE is_valid = 1 AND lap_time_ms > 0
    `);
    const allDrivers = allDriversRes.rows as unknown as { driver_guid: string; driver_name: string; nation: string }[];

    const matchedDrivers = allDrivers.filter(d => {
      const dLow = String(d.driver_name || '').toLowerCase();
      return tokens.every((tok: string) => dLow.includes(tok));
    });

    const finalDrivers = matchedDrivers.length > 0
      ? matchedDrivers
      : allDrivers.filter(d => {
          const dLow = String(d.driver_name || '').toLowerCase();
          return tokens.some((tok: string) => dLow.includes(tok));
        });

    if (finalDrivers.length === 0) {
      return NextResponse.json({
        reply: `Nessun pilota trovato con "${tokens.join(' ')}". Verifica di aver registrato almeno un giro valido sui server.`
      });
    }

    if (finalDrivers.length > 3) {
      const namesList = finalDrivers.slice(0, 6).map(d => d.driver_name).join(', ');
      return NextResponse.json({
        reply: `Ho trovato diversi piloti (${namesList}...). Specifica meglio nome e cognome!`
      });
    }

    const responses: string[] = [];

    for (const driver of finalDrivers) {
      let trackList: { track_name: string }[] = [];
      if (matchedTrack) {
        trackList = [{ track_name: matchedTrack }];
      } else {
        const driverTracksRes = await db.execute({
          sql: `SELECT DISTINCT track_name
                FROM laps
                WHERE driver_guid = ? AND is_valid = 1 AND lap_time_ms > 0
                ORDER BY track_name ASC`,
          args: [String(driver.driver_guid)]
        });
        trackList = driverTracksRes.rows as unknown as { track_name: string }[];
      }

      if (trackList.length === 0) {
        responses.push(`Nessun giro valido trovato per **${driver.driver_name}** su questa pista.`);
        continue;
      }

      const lines: string[] = [`🏁 **${driver.driver_name}** — Riepilogo Giri Veloci:`];

      for (const tr of trackList) {
        const standingsRes = await db.execute({
          sql: `WITH RankedDriverLaps AS (
                  SELECT
                    driver_guid,
                    driver_name,
                    car_model,
                    lap_time_ms,
                    sector_1_ms,
                    sector_2_ms,
                    sector_3_ms,
                    ROW_NUMBER() OVER (PARTITION BY driver_guid ORDER BY lap_time_ms ASC) as rn
                  FROM laps
                  WHERE track_name = ? AND is_valid = 1 AND lap_time_ms > 0
                )
                SELECT driver_guid, driver_name, car_model, lap_time_ms, sector_1_ms, sector_2_ms, sector_3_ms
                FROM RankedDriverLaps
                WHERE rn = 1
                ORDER BY lap_time_ms ASC`,
          args: [String(tr.track_name)]
        });
        const standings = standingsRes.rows as any[];

        const posIndex = standings.findIndex(s => String(s.driver_guid) === String(driver.driver_guid));
        if (posIndex !== -1) {
          const entry = standings[posIndex];
          const leader = standings[0];
          const pos = posIndex + 1;
          const totalDrivers = standings.length;
          const entryMs = Number(entry.lap_time_ms);
          const leaderMs = Number(leader.lap_time_ms);

          const gapText = pos === 1
            ? (standings.length > 1 ? `1° Assoluto (-${((Number(standings[1].lap_time_ms) - entryMs) / 1000).toFixed(3)}s sul 2°)` : '1° Assoluto')
            : `${formatGap(entryMs, leaderMs)} dal 1°`;

          lines.push(
            `• **${tr.track_name}**: **#${pos}** su ${totalDrivers} piloti — Tempo: **${formatMs(entryMs)}** (${gapText}) | Auto: ${entry.car_model}`
          );
        }
      }

      responses.push(lines.join('\n'));
    }

    return NextResponse.json({
      reply: responses.join('\n\n')
    });
  } catch (err) {
    console.error('Errore API Chat:', err);
    return NextResponse.json({
      reply: 'Si è verificato un errore durante la ricerca dei tempi nel database.'
    }, { status: 500 });
  }
}
