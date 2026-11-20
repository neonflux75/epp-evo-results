'use client';
import React from 'react';
import { X, Clock, MapPin, Route, CornerUpRight, Users, Timer } from 'lucide-react';
import { TrackPreview, NationFlag } from '@/lib/evoUtils';
import { useLanguage } from '@/context/LanguageContext';
import { CarHoverPreview } from './CarHoverPreview';
import tracksData from '@/config/tracksInfo.json';

interface ServerModalProps {
  srv: any;
  timerStr: string | null;
  isOvertime?: boolean;
  onClose: () => void;
}

export function ServerModal({ srv, timerStr, isOvertime = false, onClose }: ServerModalProps) {
  const { t, lang } = useLanguage();
  if (!srv) return null;

  const trackKey = String(srv.trackId || srv.track || '').trim();
  const trackInfo =
    (tracksData as Record<string, any>)[trackKey] ||
    Object.values(tracksData as Record<string, any>).find(
      (item: any) =>
        String(item?.name || '').toLowerCase() === trackKey.toLowerCase() ||
        trackKey.toLowerCase().includes(String(item?.id || '___').toLowerCase())
    ) ||
    null;

  const settings = srv.serverSettings || null;

  const formatSeconds = (sec?: number) => {
    const n = Number(sec || 0);
    if (n <= 0) return '0s';
    if (n < 60) return `${n}s`;
    const m = Math.floor(n / 60);
    const s = n % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#131720] border border-gray-700 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <TrackPreview trackName={srv.track} className="w-16 h-11 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    srv.online
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-gray-800 text-gray-400 border border-gray-700'
                  }`}
                >
                  {srv.online ? t.common.online : t.common.offline}
                </span>
                {srv.online && srv.sessionPhase && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-500/20 text-red-400 border border-red-500/40">
                    {t.liveServers.phases[srv.sessionPhase as keyof typeof t.liveServers.phases] || srv.sessionPhase}
                  </span>
                )}
                {srv.online && timerStr && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border font-mono text-[11px] font-bold ${
                      isOvertime
                        ? 'bg-red-500/20 border-red-500/60 text-red-400 animate-pulse'
                        : 'bg-gray-800 border-gray-700 text-gray-200'
                    }`}
                  >
                    <Clock className={`w-3 h-3 ${isOvertime ? 'text-red-400' : 'text-gray-400'}`} />
                    {timerStr}
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-white truncate">{srv.name}</h3>
              <p className="text-xs text-gray-400 truncate">{srv.track || t.common.trackFallback}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          {trackInfo && (
            <div className="bg-[#0e1118] border border-gray-800/90 rounded-lg p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {trackInfo.location && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-800/90 border border-gray-700/80 text-gray-200 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-red-400" />
                    {typeof trackInfo.location === 'object' ? trackInfo.location[lang] : trackInfo.location}
                  </span>
                )}
                {trackInfo.lengthKm && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-800/90 border border-gray-700/80 text-gray-200 font-mono">
                    <Route className="w-3.5 h-3.5 text-amber-400" />
                    {trackInfo.lengthKm}
                  </span>
                )}
                {trackInfo.turns && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-800/90 border border-gray-700/80 text-gray-200 font-mono">
                    <CornerUpRight className="w-3.5 h-3.5 text-sky-400" />
                    {trackInfo.turns} {lang === 'en' ? 'turns' : 'curve'}
                  </span>
                )}
              </div>
              {trackInfo.description && (
                <p className="text-xs text-gray-300 leading-relaxed">
                  {typeof trackInfo.description === 'object' ? trackInfo.description[lang] : trackInfo.description}
                </p>
              )}
            </div>
          )}

          {settings && (
            <div className="bg-[#0e1118] border border-gray-800/90 rounded-lg p-3.5 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-800/90 border border-gray-700/80 text-gray-200 font-mono">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                {lang === 'en' ? 'Wait players' : 'Attesa piloti'}: {settings.minWaitingSec}s–{settings.maxWaitingSec}s
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-300 font-mono">
                <Timer className="w-3.5 h-3.5 text-red-400" />
                Overtime: P {formatSeconds(settings.practiceOvertimeSec)} • Q {formatSeconds(settings.qualyOvertimeSec)} • W {formatSeconds(settings.warmupOvertimeSec)} • R {formatSeconds(settings.raceOvertimeSec)}
              </span>
            </div>
          )}

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2.5">
              {t.liveServers.modalTitle} ({srv.playersList?.length || 0}/{srv.maxPlayers})
            </h4>
            {!srv.playersList || srv.playersList.length === 0 ? (
              <div className="py-10 text-center text-sm text-gray-500">
                {srv.online ? t.liveServers.emptyOnline : t.liveServers.emptyOffline}
              </div>
            ) : (
              <div className="divide-y divide-gray-800 border border-gray-800 rounded-lg overflow-hidden">
                {srv.playersList.map((p: any, i: number) => (
                  <div
                    key={p.steamId || i}
                    className="p-3 bg-[#0e1118] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="px-2 py-0.5 rounded bg-red-500/15 border border-red-500/30 text-red-400 font-mono text-xs font-bold shrink-0">
                        #{p.number || '-'}
                      </span>
                      <NationFlag nation={p.nation} />
                      <span className="font-bold text-white text-sm truncate">{p.name}</span>
                    </div>
                    <div className="text-xs text-gray-300 font-medium shrink-0">
                      <CarHoverPreview carName={p.car} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
