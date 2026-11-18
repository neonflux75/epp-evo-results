'use client';
import React, { useState } from 'react';
import { Trophy, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { NationFlag, TrackPreview } from '@/lib/evoUtils';
import { useLanguage } from '@/context/LanguageContext';
import { LapTimeWithDate } from './LapTimeWithDate';

export function TrackRecordsSection({ trackRecords }: { trackRecords: any[] }) {
  const { t } = useLanguage();
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {(trackRecords || []).map((rec: any) => (
        <div key={rec.track_name} className="bg-[#131720] border border-gray-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-500">{t.records.badge}</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-white">{rec.track_name}</h3>
              <p className="text-xs text-gray-400">{rec.track_layout || t.records.standardLayout}</p>
            </div>
            <TrackPreview trackName={rec.track_name} className="w-20 h-12" />
          </div>
          <div className="pt-3 border-t border-gray-800/80 flex items-end justify-between">
            <div>
              <p className="text-sm font-bold text-white flex items-center">
                {rec.driver_name}
                <NationFlag nation={rec.nation} />
              </p>
              <p className="text-xs text-gray-400">{rec.car_model}</p>
            </div>
            <LapTimeWithDate
              ms={rec.record_ms}
              recordedAt={rec.recorded_at}
              className="text-xl font-mono font-black text-emerald-400"
            />
          </div>
        </div>
      ))}
    </section>
  );
}

type SortKey = 'name' | 'wins' | 'clean';
type SortDir = 'asc' | 'desc';

export function DriversRosterSection({
  drivers,
  onOpenDriver,
}: {
  drivers: any[];
  onOpenDriver: (guid: string, name?: string, nation?: string) => void;
}) {
  const { t } = useLanguage();
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const getCleanPct = (d: any) => {
    const total = Number(d.total_laps || 0);
    const valid = Number(d.valid_laps || 0);
    return total > 0 ? Math.round((valid / total) * 100) : 0;
  };

  const sortedDrivers = [...(drivers || [])].sort((a, b) => {
    let cmp = 0;
    if (sortKey === 'name') {
      cmp = String(a.driver_name || '').localeCompare(String(b.driver_name || ''), undefined, {
        sensitivity: 'base',
      });
    } else if (sortKey === 'wins') {
      cmp = Number(a.wins || 0) - Number(b.wins || 0);
      if (cmp === 0) {
        cmp = String(a.driver_name || '').localeCompare(String(b.driver_name || ''), undefined, {
          sensitivity: 'base',
        });
      }
    } else if (sortKey === 'clean') {
      cmp = getCleanPct(a) - getCleanPct(b);
      if (cmp === 0) {
        cmp = Number(a.valid_laps || 0) - Number(b.valid_laps || 0);
      }
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="w-3 h-3 text-gray-600" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-red-400" />
    ) : (
      <ArrowDown className="w-3 h-3 text-red-400" />
    );
  };

  return (
    <section className="bg-[#131720] border border-gray-800/90 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-base font-bold text-white">{t.driversRoster.title}</h2>
        <p className="text-xs text-gray-400">{t.driversRoster.subtitle}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0e1118] text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-800 select-none">
              <th className="py-3 px-4">
                <button
                  type="button"
                  onClick={() => handleSort('name')}
                  className="inline-flex items-center gap-1.5 hover:text-white transition cursor-pointer uppercase"
                >
                  <span>{t.common.driver}</span>
                  {renderSortIcon('name')}
                </button>
              </th>
              <th className="py-3 px-3 text-center">
                <button
                  type="button"
                  onClick={() => handleSort('wins')}
                  className="inline-flex items-center justify-center gap-1.5 hover:text-white transition cursor-pointer uppercase"
                >
                  <span>{t.driversRoster.raceWins}</span>
                  {renderSortIcon('wins')}
                </button>
              </th>
              <th className="py-3 px-4 text-right w-40 sm:w-44">
                <button
                  type="button"
                  onClick={() => handleSort('clean')}
                  className="inline-flex items-center justify-end gap-1.5 hover:text-white transition cursor-pointer uppercase"
                >
                  <span>Clean</span>
                  {renderSortIcon('clean')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 text-sm">
            {sortedDrivers.map((d: any) => {
              const total = Number(d.total_laps || 0);
              const valid = Number(d.valid_laps || 0);
              const pct = getCleanPct(d);

              const pillStyle =
                pct >= 85
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                  : pct >= 65
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  : 'bg-red-500/15 text-red-400 border-red-500/40';

              return (
                <tr key={d.driver_guid} className="hover:bg-gray-800/30">
                  <td className="py-3 px-4 font-semibold text-white">
                    <button
                      type="button"
                      onClick={() => onOpenDriver(d.driver_guid, d.driver_name, d.nation)}
                      className="hover:text-red-400 hover:underline transition text-left cursor-pointer"
                    >
                      {d.driver_name}
                    </button>
                    <NationFlag nation={d.nation} />
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-amber-400">{d.wins || 0}</td>
                  <td
                    className="py-3 px-4 text-right"
                    title={`${t.driversRoster.validLaps}: ${valid} / ${total}`}
                  >
                    <div className="inline-flex items-center justify-end gap-2">
                      <div className="w-16 sm:w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700/70">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            background: 'linear-gradient(90deg, #ef4444 0%, #eab308 50%, #10b981 100%)',
                          }}
                        />
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full border font-mono text-[10px] font-extrabold leading-none ${pillStyle}`}
                      >
                        {pct}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
