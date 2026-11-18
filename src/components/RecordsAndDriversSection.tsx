'use client';
import React from 'react';
import { Trophy } from 'lucide-react';
import { NationFlag, TrackPreview, formatMs, formatLocalDateTime } from '@/lib/evoUtils';
import { useLanguage } from '@/context/LanguageContext';

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
            <span className="text-xl font-mono font-black text-emerald-400">{formatMs(rec.record_ms)}</span>
          </div>
        </div>
      ))}
    </section>
  );
}

export function DriversRosterSection({
  drivers,
  onOpenDriver,
}: {
  drivers: any[];
  onOpenDriver: (guid: string, name?: string, nation?: string) => void;
}) {
  const { t, lang } = useLanguage();

  const sortedDrivers = [...(drivers || [])].sort((a, b) =>
    String(a.driver_name || '').localeCompare(String(b.driver_name || ''), undefined, { sensitivity: 'base' })
  );

  return (
    <section className="bg-[#131720] border border-gray-800/90 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-base font-bold text-white">{t.driversRoster.title}</h2>
        <p className="text-xs text-gray-400">{t.driversRoster.subtitle}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0e1118] text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-800">
              <th className="py-3 px-4">{t.common.driver}</th>
              <th className="py-3 px-4 text-center">{t.driversRoster.raceWins}</th>
              <th className="py-3 px-4 w-48">Safety Rating</th>
              <th className="py-3 px-4 text-right">{t.driversRoster.bestEver}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 text-sm">
            {sortedDrivers.map((d: any) => {
              const total = Number(d.total_laps || 0);
              const valid = Number(d.valid_laps || 0);
              const pct = total > 0 ? Math.round((valid / total) * 100) : 0;
              const barColor =
                pct >= 85 ? 'bg-emerald-500' : pct >= 65 ? 'bg-amber-400' : 'bg-red-500';
              const textColor =
                pct >= 85 ? 'text-emerald-400' : pct >= 65 ? 'text-amber-400' : 'text-red-400';

              const bestDate = d.best_lap_date || d.best_recorded_at || d.recorded_at || '';
              const bestTooltip = bestDate
                ? `${lang === 'en' ? 'Recorded on' : 'Registrato il'}: ${formatLocalDateTime(bestDate)}`
                : undefined;

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
                  <td className="py-3 px-4 text-center font-bold text-amber-400">{d.wins || 0}</td>
                  <td
                    className="py-3 px-4"
                    title={`${t.driversRoster.validLaps}: ${valid} / ${total}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden border border-gray-700/70">
                        <div
                          className={`h-full ${barColor} transition-all duration-300`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className={`font-mono text-xs font-bold w-10 text-right ${textColor}`}>
                        {pct}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-gray-200">
                    <span
                      title={bestTooltip}
                      className={bestTooltip ? 'cursor-help border-b border-dotted border-gray-600' : ''}
                    >
                      {formatMs(d.best_ever_ms)}
                    </span>
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
