'use client';
import React from 'react';
import { Users, Car, X, Clock } from 'lucide-react';
import { NationFlag, TrackPreview } from '@/lib/evoUtils';
import { useLanguage } from '@/context/LanguageContext';

export function ServerModal({ srv, timerStr, onClose }: { srv: any; timerStr: string | null; onClose: () => void }) {
  const { t } = useLanguage();
  if (!srv) return null;
  const phase = srv.online ? (t.liveServers.phases[srv.sessionPhase as keyof typeof t.liveServers.phases] || srv.sessionPhase) : t.common.offline;
  const count = Math.max(srv.players || 0, srv.playersList?.length || 0);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#131720] border border-gray-700 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <TrackPreview trackName={srv.track} className="w-16 h-11" />
            <div>
              <div className="inline-flex items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${srv.online ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400'}`}>{phase}</span>
                {timerStr && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-200 font-mono text-[11px] font-bold"><Clock className="w-3 h-3 text-gray-400" />{timerStr}</span>}
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">{srv.name}</h3>
              <p className="text-xs text-gray-400">{t.common.track}: <strong className="text-gray-200">{srv.track || t.common.trackFallback}</strong> • {t.liveServers.connectedDrivers}: <strong className="text-amber-400">{count}/{srv.maxPlayers}</strong></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 overflow-y-auto">
          {srv.playersList?.length > 0 ? (
            <div className="border border-gray-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#0e1118] text-[11px] uppercase text-gray-400">
                  <tr><th className="py-2.5 px-3 w-16">{t.liveServers.raceNumber}</th><th className="py-2.5 px-3">{t.common.driver}</th><th className="py-2.5 px-3">{t.common.vehicle}</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {srv.playersList.map((p: any) => (
                    <tr key={p.steamId} className="hover:bg-gray-800/30">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-400">#{p.number}</td>
                      <td className="py-2.5 px-3 font-semibold text-white"><span className="inline-flex items-center">{p.name}<NationFlag nation={p.nation} /></span></td>
                      <td className="py-2.5 px-3 text-xs text-gray-300 flex items-center gap-1.5"><Car className="w-3.5 h-3.5 text-red-400 shrink-0" /> {p.car}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-gray-400 space-y-1">
              <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="font-semibold text-gray-300">{t.liveServers.noDriversTitle}</p>
              <p className="text-xs text-gray-500">{t.liveServers.noDriversSub}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
