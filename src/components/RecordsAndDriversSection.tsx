'use client';
import React from 'react';
import { Trophy } from 'lucide-react';
import { NationFlag, TrackPreview } from '@/lib/evoUtils';
import { useLanguage } from '@/context/LanguageContext';
import { LapTimeWithDate } from './LapTimeWithDate';

export { DriversRosterSection } from './DriversRosterTable';

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
