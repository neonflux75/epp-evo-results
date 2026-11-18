'use client';
import React, { useMemo } from 'react';
import { formatMs, formatGap } from '@/lib/evoUtils';
import { NationFlag } from './SharedUI';
import { useLanguage } from '@/context/LanguageContext';
import { LapTimeWithDate } from './LapTimeWithDate';

interface LeaderboardSectionProps {
  tracks: any[];
  leaderboard: any[];
  trackBestSectors?: any[];
  selectedTrack: string;
  selectedCar: string;
  onTrackChange: (track: string) => void;
  onCarChange: (car: string) => void;
  onOpenDriver: (guid: string, name?: string, nation?: string) => void;
}

export function LeaderboardSection({
  tracks,
  leaderboard,
  trackBestSectors = [],
  selectedTrack,
  selectedCar,
  onTrackChange,
  onCarChange,
  onOpenDriver,
}: LeaderboardSectionProps) {
  const { t } = useLanguage();

  const availableCars = Array.from(
    new Set((leaderboard || []).map((r: any) => r.car_model).filter(Boolean))
  ).sort() as string[];

  const effectiveSelectedCar =
    selectedCar === 'ALL' || availableCars.includes(selectedCar) ? selectedCar : 'ALL';

  const filteredLeaderboard = (leaderboard || []).filter((r: any) =>
    effectiveSelectedCar === 'ALL' ? true : r.car_model === effectiveSelectedCar
  );

  const bestLeaderboardTime = filteredLeaderboard.length > 0 ? filteredLeaderboard[0].best_lap_ms : 0;

  const bestSectorsByTrack = useMemo(() => {
    const map = new Map<string, { s1: number; s2: number; s3: number }>();
    for (const item of trackBestSectors || []) {
      if (!item?.track_name) continue;
      map.set(String(item.track_name), {
        s1: Number(item.best_s1 || 0),
        s2: Number(item.best_s2 || 0),
        s3: Number(item.best_s3 || 0),
      });
    }
    for (const row of leaderboard || []) {
      const tr = String(row?.track_name || '');
      if (!tr) continue;
      const cur = map.get(tr) || { s1: 0, s2: 0, s3: 0 };
      const s1 = Number(row.sector_1_ms || 0);
      const s2 = Number(row.sector_2_ms || 0);
      const s3 = Number(row.sector_3_ms || 0);
      if (s1 > 0 && (cur.s1 === 0 || s1 < cur.s1)) cur.s1 = s1;
      if (s2 > 0 && (cur.s2 === 0 || s2 < cur.s2)) cur.s2 = s2;
      if (s3 > 0 && (cur.s3 === 0 || s3 < cur.s3)) cur.s3 = s3;
      map.set(tr, cur);
    }
    return map;
  }, [trackBestSectors, leaderboard]);

  return (
    <section className="bg-[#131720] border border-gray-800/90 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">{t.leaderboard.title}</h2>
          <p className="text-xs text-gray-400">{t.leaderboard.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">{t.common.track}:</label>
            <select
              value={selectedTrack}
              onChange={(e) => onTrackChange(e.target.value)}
              className="bg-[#0b0d11] border border-gray-700 text-sm text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-500"
            >
              {tracks.map((tr: any) => (
                <option key={tr.track_name} value={tr.track_name}>
                  {tr.track_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">{t.common.car}:</label>
            <select
              value={effectiveSelectedCar}
              onChange={(e) => onCarChange(e.target.value)}
              className="bg-[#0b0d11] border border-gray-700 text-sm text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-500 max-w-[230px]"
            >
              <option value="ALL">{t.common.allCars}</option>
              {availableCars.map((c: string) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0e1118] text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-800">
              <th className="py-3 px-4 w-12">{t.common.pos}</th>
              <th className="py-3 px-4">{t.common.driver}</th>
              <th className="py-3 px-4">{t.common.vehicle}</th>
              <th className="py-3 px-4">{t.common.track}</th>
              <th className="py-3 px-4 text-right">{t.common.sector1}</th>
              <th className="py-3 px-4 text-right">{t.common.sector2}</th>
              <th className="py-3 px-4 text-right">{t.common.sector3}</th>
              <th className="py-3 px-4 text-right">{t.common.bestLap}</th>
              <th className="py-3 px-4 text-right">{t.common.gap}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 text-sm">
            {filteredLeaderboard.map((row: any, i: number) => {
              const bestSec = bestSectorsByTrack.get(String(row.track_name || ''));
              const isBestS1 = bestSec && Number(row.sector_1_ms) > 0 && Number(row.sector_1_ms) <= bestSec.s1;
              const isBestS2 = bestSec && Number(row.sector_2_ms) > 0 && Number(row.sector_2_ms) <= bestSec.s2;
              const isBestS3 = bestSec && Number(row.sector_3_ms) > 0 && Number(row.sector_3_ms) <= bestSec.s3;

              return (
                <tr key={`${row.driver_guid}-${row.car_model}-${row.track_name}`} className="hover:bg-gray-800/30 transition">
                  <td className="py-3 px-4 font-mono font-bold">
                    {i === 0 ? (
                      <span className="text-amber-400">#1</span>
                    ) : i === 1 ? (
                      <span className="text-gray-300">#2</span>
                    ) : i === 2 ? (
                      <span className="text-amber-600">#3</span>
                    ) : (
                      <span className="text-gray-500">#{i + 1}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-semibold text-white">
                    <button
                      type="button"
                      onClick={() => onOpenDriver(row.driver_guid, row.driver_name, row.nation)}
                      className="hover:text-red-400 hover:underline transition text-left cursor-pointer"
                      title={t.leaderboard.driverTooltip}
                    >
                      {row.driver_name}
                    </button>
                    <NationFlag nation={row.nation} />
                  </td>
                  <td className="py-3 px-4 text-gray-300 text-xs">{row.car_model}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{row.track_name}</td>
                  <td className={`py-3 px-4 text-right font-mono text-xs ${isBestS1 ? 'text-emerald-400 font-bold' : 'text-gray-400'}`}>
                    {formatMs(row.sector_1_ms)}
                  </td>
                  <td className={`py-3 px-4 text-right font-mono text-xs ${isBestS2 ? 'text-emerald-400 font-bold' : 'text-gray-400'}`}>
                    {formatMs(row.sector_2_ms)}
                  </td>
                  <td className={`py-3 px-4 text-right font-mono text-xs ${isBestS3 ? 'text-emerald-400 font-bold' : 'text-gray-400'}`}>
                    {formatMs(row.sector_3_ms)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <LapTimeWithDate ms={row.best_lap_ms} recordedAt={row.last_set} />
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-xs text-gray-400">
                    {formatGap(row.best_lap_ms, bestLeaderboardTime)}
                  </td>
                </tr>
              );
            })}
            {filteredLeaderboard.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-gray-500">
                  {t.leaderboard.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
