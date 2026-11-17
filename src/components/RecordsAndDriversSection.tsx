'use client';
import React from 'react';
import { Trophy } from 'lucide-react';
import { NationFlag, TrackPreview, formatMs } from '@/lib/evoUtils';

export function TrackRecordsSection({ trackRecords }: { trackRecords: any[] }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {(trackRecords || []).map((rec: any) => (
        <div key={rec.track_name} className="bg-[#131720] border border-gray-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-500">Track Record</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-white">{rec.track_name}</h3>
              <p className="text-xs text-gray-400">{rec.track_layout || 'Layout Standard'}</p>
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
  return (
    <section className="bg-[#131720] border border-gray-800/90 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-base font-bold text-white">Albo Piloti</h2>
        <p className="text-xs text-gray-400">Clicca su un pilota per visualizzare i suoi migliori tempi sui circuiti</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0e1118] text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-800">
              <th className="py-3 px-4">Pilota</th>
              <th className="py-3 px-4 text-center">Vittorie Gara</th>
              <th className="py-3 px-4 text-center">Giri Validi</th>
              <th className="py-3 px-4 text-center">Giri Totali</th>
              <th className="py-3 px-4 text-right">Miglior Tempo Assoluto</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 text-sm">
            {(drivers || []).map((d: any) => (
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
                <td className="py-3 px-4 text-center text-emerald-400 font-mono">{d.valid_laps}</td>
                <td className="py-3 px-4 text-center text-gray-400 font-mono">{d.total_laps}</td>
                <td className="py-3 px-4 text-right font-mono text-gray-200">{formatMs(d.best_ever_ms)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}