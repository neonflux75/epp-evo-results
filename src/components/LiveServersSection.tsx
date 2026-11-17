'use client';
import React, { useState, useEffect } from 'react';
import { Server, Clock } from 'lucide-react';
import { TrackPreview } from '@/lib/evoUtils';
import { useLanguage } from '@/context/LanguageContext';
import { ServerModal } from './ServerModal';

interface LiveServersSectionProps {
  liveServers: any[];
  onlineViewers?: number;
  selectedLiveServerId: string | null;
  onSelectServer: (id: string | null) => void;
}

export function LiveServersSection({ liveServers, onlineViewers, selectedLiveServerId, onSelectServer }: LiveServersSectionProps) {
  const { t } = useLanguage();
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const iv = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const formatTimer = (srv: any) => {
    if (!srv?.online || !srv?.sessionEndTimeMs) return null;
    const diffSec = Math.max(0, Math.floor((Number(srv.sessionEndTimeMs) - nowMs) / 1000));
    if (diffSec === 0) return '00:00';
    return `${String(Math.floor(diffSec / 60)).padStart(2, '0')}:${String(diffSec % 60).padStart(2, '0')}`;
  };

  const activeModal = liveServers.find((s: any) => s.id === selectedLiveServerId) || null;

  return (
    <>
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <Server className="w-4 h-4 text-red-500" /> {t.liveServers.title} ({liveServers.length}) —{' '}
            <span className="text-gray-500 normal-case font-normal">{t.liveServers.clickHint}</span>
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
            const timerStr = formatTimer(srv);
            return (
              <div key={srv.id} onClick={() => onSelectServer(srv.id)} className="bg-[#131720] border border-gray-800/90 rounded-lg p-4 flex flex-col justify-between hover:border-red-500/60 hover:bg-[#171c28] cursor-pointer transition group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <TrackPreview trackName={srv.track} className="w-16 h-11" />
                    <div className="min-w-0">
                      {srv.online && srv.sessionPhase && (
                        <div className="inline-flex items-center gap-1.5 mb-1">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${srv.sessionPhase === 'GARA' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : srv.sessionPhase === 'QUALIFICHE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-sky-500/20 text-sky-400 border border-sky-500/40'}`}>
                            {t.liveServers.phases[srv.sessionPhase as keyof typeof t.liveServers.phases] || srv.sessionPhase}
                          </span>
                          {timerStr && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-800/90 border border-gray-700 text-gray-200 font-mono text-[10px] font-bold">
                              <Clock className="w-2.5 h-2.5 text-gray-400" />
                              {timerStr}
                            </span>
                          )}
                        </div>
                      )}
                      <h3 className="text-sm font-bold text-white leading-tight line-clamp-1 group-hover:text-red-400 transition">{srv.name}</h3>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{srv.track || t.common.trackFallback}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${srv.online ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${srv.online ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                    {srv.online ? t.common.online : t.common.offline}
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs">
                  <span className="text-gray-500">{t.liveServers.clickForDrivers}</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded ${count > 0 ? 'bg-amber-500/15 text-amber-400' : 'bg-gray-800/80 text-gray-400'}`}>
                    {t.liveServers.driversCount}: {count}/{srv.maxPlayers}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <ServerModal srv={activeModal} timerStr={formatTimer(activeModal)} onClose={() => onSelectServer(null)} />
    </>
  );
}
