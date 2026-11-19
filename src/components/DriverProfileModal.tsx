'use client';
import React, { useState } from 'react';
import { Timer, X, Activity } from 'lucide-react';
import { NationFlag, TrackPreview, formatMs } from '@/lib/evoUtils';
import { useLanguage } from '@/context/LanguageContext';
import { LapTimeWithDate } from './LapTimeWithDate';
import { CarHoverPreview } from './CarHoverPreview';

interface DriverProfileModalProps {
  profile: any;
  loading: boolean;
  onClose: () => void;
}

export function DriverProfileModal({ profile, loading, onClose }: DriverProfileModalProps) {
  const { t } = useLanguage();
  const [carFilter, setCarFilter] = useState<string>('ALL');

  if (!profile) return null;

  const records = profile.records || profile.laps || [];
  const availableCars = Array.from(new Set(records.map((r: any) => r.car_model).filter(Boolean))).sort() as string[];
  const filteredRecords = records.filter((r: any) => (carFilter === 'ALL' ? true : r.car_model === carFilter));

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#131720] border border-gray-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-extrabold text-white flex items-center">
                {profile.driver?.driver_name}
                <NationFlag nation={profile.driver?.nation} />
              </h3>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{t.driverModal.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">{t.driverModal.filterCar}</label>
              <select
                value={carFilter}
                onChange={(e) => setCarFilter(e.target.value)}
                className="bg-[#0b0d11] border border-gray-700 text-xs sm:text-sm text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-500 max-w-[210px]"
              >
                <option value="ALL">{t.driverModal.allCarsCount.replace('{count}', String(records.length))}</option>
                {availableCars.map((c: string) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 overflow-y-auto">
          {loading ? (
            <div className="py-12 flex items-center justify-center gap-2 text-red-400 text-sm font-semibold">
              <Activity className="w-4 h-4 animate-spin" /> {t.driverModal.loading}
            </div>
          ) : filteredRecords.length > 0 ? (
            <div className="overflow-x-auto border border-gray-800 rounded-lg">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="bg-[#0e1118] text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-800">
                  <tr>
                    <th className="py-2.5 px-3">{t.common.track}</th>
                    <th className="py-2.5 px-3">{t.common.vehicle}</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap w-px">{t.driverModal.overallRank}</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap w-px">{t.driverModal.carRank}</th>
                    <th className="py-2.5 px-2.5 text-right whitespace-nowrap">{t.common.sector1}</th>
                    <th className="py-2.5 px-2.5 text-right whitespace-nowrap">{t.common.sector2}</th>
                    <th className="py-2.5 px-2.5 text-right whitespace-nowrap">{t.common.sector3}</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">{t.common.bestLap}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/70">
                  {filteredRecords.map((rec: any, idx: number) => {
                    const isBestS1 = Number(rec.sector_1_ms) > 0 && Number(rec.sector_1_ms) <= Number(rec.track_best_s1 || 0);
                    const isBestS2 = Number(rec.sector_2_ms) > 0 && Number(rec.sector_2_ms) <= Number(rec.track_best_s2 || 0);
                    const isBestS3 = Number(rec.sector_3_ms) > 0 && Number(rec.sector_3_ms) <= Number(rec.track_best_s3 || 0);

                    return (
                      <tr key={`${rec.track_name}-${rec.car_model}-${idx}`} className="hover:bg-gray-800/30">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <TrackPreview trackName={rec.track_name} className="w-12 h-8" />
                            <span className="font-semibold text-white text-xs sm:text-sm">{rec.track_name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-gray-300">
                          <CarHoverPreview carName={rec.car_model} showIcon={false} />
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono whitespace-nowrap w-px">
                          <div className="inline-flex items-center justify-center gap-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${rec.overall_rank === 1 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : rec.overall_rank <= 3 ? 'bg-gray-700/60 text-gray-200' : 'bg-gray-800/80 text-gray-300'}`}>
                              #{rec.overall_rank}
                            </span>
                            <span className="text-[11px] text-gray-500">/ {rec.overall_total}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono whitespace-nowrap w-px">
                          <div className="inline-flex items-center justify-center gap-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${rec.car_rank === 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800/80 text-gray-300'}`}>
                              #{rec.car_rank}
                            </span>
                            <span className="text-[11px] text-gray-500">/ {rec.car_total}</span>
                          </div>
                        </td>
                        <td className={`py-2.5 px-2.5 text-right font-mono text-[11px] whitespace-nowrap ${isBestS1 ? 'text-emerald-400 font-bold' : 'text-gray-400'}`}>
                          {formatMs(rec.sector_1_ms)}
                        </td>
                        <td className={`py-2.5 px-2.5 text-right font-mono text-[11px] whitespace-nowrap ${isBestS2 ? 'text-emerald-400 font-bold' : 'text-gray-400'}`}>
                          {formatMs(rec.sector_2_ms)}
                        </td>
                        <td className={`py-2.5 px-2.5 text-right font-mono text-[11px] whitespace-nowrap ${isBestS3 ? 'text-emerald-400 font-bold' : 'text-gray-400'}`}>
                          {formatMs(rec.sector_3_ms)}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <LapTimeWithDate ms={rec.best_lap_ms} recordedAt={rec.recorded_at} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-gray-500 text-sm">{t.driverModal.empty}</div>
          )}
        </div>
      </div>
    </div>
  );
}
