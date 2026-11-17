'use client';
import React from 'react';
import { formatMs, formatGap } from '@/lib/utils';
import { NationFlag } from './SharedUI';

interface LeaderboardSectionProps {
  tracks: any[];
  leaderboard: any[];
  selectedTrack: string;
  selectedCar: string;
  onTrackChange: (track: string) => void;
  onCarChange: (car: string) => void;
  onOpenDriver: (guid: string, name?: string, nation?: string) => void;
}

export function LeaderboardSection({
  tracks,
  leaderboard,
  selectedTrack,
  selectedCar,
  onTrackChange,
  onCarChange,
  onOpenDriver,
}: LeaderboardSectionProps) {
  const availableCars = Array.from(
    new Set((leaderboard || []).map((r: any) => r.car_model).filter(Boolean))
  ).sort() as string[];

  const effectiveSelectedCar =
    selectedCar === 'ALL' || availableCars.includes(selectedCar) ? selectedCar : 'ALL';

  const filteredLeaderboard = (leaderboard || []).filter((r: any) =>
    effectiveSelectedCar === 'ALL' ? true : r.car_model === effectiveSelectedCar
  );

  const bestLeaderboardTime = filteredLeaderboard.length > 0 ? filteredLeaderboard[0].best_lap_ms : 0;

  return (
    <section className="bg-[#131720] border border-gray-800/90 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">Classifica Top 100 Migliori Tempi</h2>
          <p className="text-xs text-gray-400">
            Clicca su un pilota per vedere tutti i suoi giri veloci sui vari tracciati
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Circuito:</label>
            <select
              value={selectedTrack}
              onChange={(e) => onTrackChange(e.target.value)}
              className="bg-[#0b0d11] border border-gray-700 text-sm text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-500"
            >
              {tracks.map((t: any) => (
                <option key={t.track_name} value={t.track_name}>
                  {t.track_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Auto:</label>
            <select
              value={effectiveSelectedCar}
              onChange={(e) => onCarChange(e.target.value)}
              className="bg-[#0b0d11] border border-gray-700 text-sm text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-500 max-w-[230px]"
            >
              <option value="ALL">Tutte le auto</option>
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
              <th className="py-3 px-4 w-12">Pos</th>
              <th className="py-3 px-4">Pilota</th>
              <th className="py-3 px-4">Vettura</th>
              <th className="py-3 px-4">Circuito</th>
              <th className="py-3 px-4 text-right">Settore 1</th>
              <th className="py-3 px-4 text-right">Settore 2</th>
              <th className="py-3 px-4 text-right">Settore 3</th>
              <th className="py-3 px-4 text-right">Miglior Giro</th>
              <th className="py-3 px-4 text-right">Distacco</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 text-sm">
            {filteredLeaderboard.map((row: any, i: number) => (
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
                    title="Vedi tutti i giri veloci di questo pilota"
                  >
                    {row.driver_name}
                  </button>
                  <NationFlag nation={row.nation} />
                </td>
                <td className="py-3 px-4 text-gray-300 text-xs">{row.car_model}</td>
                <td className="py-3 px-4 text-gray-400 text-xs">{row.track_name}</td>
                <td className="py-3 px-4 text-right font-mono text-xs text-gray-400">{formatMs(row.sector_1_ms)}</td>
                <td className="py-3 px-4 text-right font-mono text-xs text-gray-400">{formatMs(row.sector_2_ms)}</td>
                <td className="py-3 px-4 text-right font-mono text-xs text-gray-400">{formatMs(row.sector_3_ms)}</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">{formatMs(row.best_lap_ms)}</td>
                <td className="py-3 px-4 text-right font-mono text-xs text-gray-400">
                  {formatGap(row.best_lap_ms, bestLeaderboardTime)}
                </td>
              </tr>
            ))}
            {filteredLeaderboard.length === 0 && (
              <tr>
                <td colSpan={9} className="py-8 text-center text-gray-500">
                  Nessun giro valido registrato per questa selezione.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
