'use client';
import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { formatMs } from '@/lib/evoUtils';
import { useLanguage } from '@/context/LanguageContext';

interface DriverLapsSubtableProps {
  driverName: string;
  bestLapMs: number;
  laps: any[];
}

export function DriverLapsSubtable({ driverName, bestLapMs, laps }: DriverLapsSubtableProps) {
  const { t } = useLanguage();

  return (
    <tr>
      <td colSpan={6} className="bg-[#0b0d11] p-3 border-t border-gray-800">
        <div className="text-[11px] uppercase tracking-wider text-gray-400 font-bold mb-2">
          {t.sessions.lapsRecordedBy} {driverName} ({laps.length})
        </div>
        {laps.length > 0 ? (
          <div className="border border-gray-800/90 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#11141b] text-[10px] uppercase text-gray-400">
                <tr>
                  <th className="py-1.5 px-3 w-14">{t.common.lap}</th>
                  <th className="py-1.5 px-3 text-right">{t.common.sector1}</th>
                  <th className="py-1.5 px-3 text-right">{t.common.sector2}</th>
                  <th className="py-1.5 px-3 text-right">{t.common.sector3}</th>
                  <th className="py-1.5 px-3 text-right">{t.common.bestLap}</th>
                  <th className="py-1.5 px-3 text-center">{t.common.validity}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {laps.map((l: any, idx: number) => (
                  <tr key={l.id || idx} className="hover:bg-gray-800/20">
                    <td className="py-1.5 px-3 font-mono text-gray-500">#{idx + 1}</td>
                    <td className="py-1.5 px-3 text-right font-mono text-gray-400">{formatMs(l.sector_1_ms)}</td>
                    <td className="py-1.5 px-3 text-right font-mono text-gray-400">{formatMs(l.sector_2_ms)}</td>
                    <td className="py-1.5 px-3 text-right font-mono text-gray-400">{formatMs(l.sector_3_ms)}</td>
                    <td
                      className={`py-1.5 px-3 text-right font-mono font-bold ${
                        l.is_valid
                          ? l.lap_time_ms === bestLapMs
                            ? 'text-emerald-400'
                            : 'text-white'
                          : 'text-red-400 line-through'
                      }`}
                    >
                      {formatMs(l.lap_time_ms)}
                    </td>
                    <td className="py-1.5 px-3 text-center">
                      {l.is_valid ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-red-500 inline" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-gray-500 py-2">{t.sessions.noLapDetails}</p>
        )}
      </td>
    </tr>
  );
}
