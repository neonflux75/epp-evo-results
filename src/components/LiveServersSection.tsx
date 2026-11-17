'use client';
import React from 'react';
import { Server, Users, Car, X } from 'lucide-react';
import { NationFlag, TrackPreview } from '@/lib/evoUtils';
import { useLanguage } from '@/context/LanguageContext';

interface LiveServersSectionProps {
  liveServers: any[];
  onlineViewers?: number;
  selectedLiveServerId: string | null;
  onSelectServer: (id: string | null) => void;
}

export function LiveServersSection({
  liveServers,
  onlineViewers,
  selectedLiveServerId,
  onSelectServer,
}: LiveServersSectionProps) {
  const { t } = useLanguage();
  const activeServerModal = liveServers.find((s: any) => s.id === selectedLiveServerId) || null;

  const translatePhase = (phase?: string) => {
    if (!phase) return '';
    return t.liveServers.phases[phase as keyof typeof t.liveServers.phases] || phase;
  };

  return (
    <>
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <Server className="w-4 h-4 text-red-500" /> {t.liveServers.title} ({liveServers.length}) —{' '}
            <span className="text-gray-500 normal-case font-normal">
              {t.liveServers.clickHint}
            </span>
          </h2>
          <div className="flex items-center gap-3 text-[11px]">
            {typeof onlineViewers === 'number' && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {onlineViewers} {onlineViewers === 1 ? t.liveServers.userOnline : t.liveServers.usersOnline}
              </span>
            )}
            <span className="text-gray-500">{t.liveServers.liveInterval}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {liveServers.map((srv: any) => {
            const count = Math.max(srv.players || 0, srv.playersList?.length || 0);
            return (
              <div
                key={srv.id}
                onClick={() => onSelectServer(srv.id)}
                className="bg-[#131720] border border-gray-800/90 rounded-lg p-4 flex flex-col justify-between hover:border-red-500/60 hover:bg-[#171c28] cursor-pointer transition group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <TrackPreview trackName={srv.track} className="w-16 h-11" />
                    <div className="min-w-0">
                      {srv.online && srv.sessionPhase && (
                        <span
                          className={`inline-block mb-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                            srv.sessionPhase === 'GARA'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                              : srv.sessionPhase === 'QUALIFICHE'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                              : 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                          }`}
                        >
                          {translatePhase(srv.sessionPhase)}
                        </span>
                      )}
                      <h3 className="text-sm font-bold text-white leading-tight line-clamp-1 group-hover:text-red-400 transition">
                        {srv.name}
                      </h3>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {srv.track || t.common.trackFallback}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                      srv.online
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-gray-800 text-gray-400 border border-gray-700'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        srv.online ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'
                      }`}
                    />
                    {srv.online ? t.common.online : t.common.offline}
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs">
                  <span className="text-gray-500">{t.liveServers.clickForDrivers}</span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded ${
                      count > 0 ? 'bg-amber-500/15 text-amber-400' : 'bg-gray-800/80 text-gray-400'
                    }`}
                  >
                    {t.liveServers.driversCount}: {count}/{srv.maxPlayers}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {activeServerModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => onSelectServer(null)}
        >
          <div
            className="bg-[#131720] border border-gray-700 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <TrackPreview trackName={activeServerModal.track} className="w-16 h-11" />
                <div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      activeServerModal.online ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {activeServerModal.online ? translatePhase(activeServerModal.sessionPhase) : t.common.offline}
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">{activeServerModal.name}</h3>
                  <p className="text-xs text-gray-400">
                    {t.common.track}: <strong className="text-gray-200">{activeServerModal.track || t.common.trackFallback}</strong> •{' '}
                    {t.liveServers.connectedDrivers}:{' '}
                    <strong className="text-amber-400">
                      {Math.max(activeServerModal.players || 0, activeServerModal.playersList?.length || 0)}/
                      {activeServerModal.maxPlayers}
                    </strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => onSelectServer(null)}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              {activeServerModal.playersList?.length > 0 ? (
                <div className="border border-gray-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#0e1118] text-[11px] uppercase text-gray-400">
                      <tr>
                        <th className="py-2.5 px-3 w-16">{t.liveServers.raceNumber}</th>
                        <th className="py-2.5 px-3">{t.common.driver}</th>
                        <th className="py-2.5 px-3">{t.common.vehicle}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {activeServerModal.playersList.map((p: any) => (
                        <tr key={p.steamId} className="hover:bg-gray-800/30">
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-400">#{p.number}</td>
                          <td className="py-2.5 px-3 font-semibold text-white">
                            <span className="inline-flex items-center">
                              {p.name}
                              <NationFlag nation={p.nation} />
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-xs text-gray-300 flex items-center gap-1.5">
                            <Car className="w-3.5 h-3.5 text-red-400 shrink-0" /> {p.car}
                          </td>
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
      )}
    </>
  );
}
