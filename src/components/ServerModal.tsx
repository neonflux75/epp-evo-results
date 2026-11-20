'use client';
import React from 'react';
import { X, Clock, MapPin, Route, CornerUpRight, Users, Timer } from 'lucide-react';
import { TrackPreview, getCountryFlagUrl } from '@/lib/evoUtils';
import { useLanguage } from '@/context/LanguageContext';
import { CarHoverPreview } from './CarHoverPreview';
import tracksData from '@/config/tracksInfo.json';

interface ServerModalProps {
  srv: any;
  timerStr: string | null;
  isOvertime?: boolean;
  onClose: () => void;
}

interface TrackEntry {
  keywords: string[];
  location: { it: string; en: string };
  lengthKm: string;
  turns: number;
  description: { it: string; en: string };
}

function findTrackDetails(rawTrack?: string, rawTrackId?: string): TrackEntry | null {
  const combined = `${rawTrack || ''} ${rawTrackId || ''}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  if (!combined) return null;

  for (const entry of tracksData as TrackEntry[]) {
    if (entry.keywords.some((kw) => combined.includes(kw.toLowerCase()))) {
      return entry;
    }
  }
  return null;
}

export function ServerModal({ srv, timerStr, isOvertime = false, onClose }: ServerModalProps) {
  const { t, lang } = useLanguage();
  if (!srv) return null;

  const trackInfo = findTrackDetails(srv.track, srv.trackId);
  const settings = srv.serverSettings || null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#131720] border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <TrackPreview trackName={srv.track} className="w-16 h-11 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-white truncate">{srv.name}</h3>
              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5 flex-wrap">
                <span>{srv.track || t.common.trackFallback}</span>
                {srv.online && srv.sessionPhase && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                      srv.sessionPhase === 'GARA'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : srv.sessionPhase === 'QUALIFICHE'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                    }`}
                  >
                    {t.liveServers.phases[srv.sessionPhase as keyof typeof t.liveServers.phases] ||
                      srv.sessionPhase}
                  </span>
                )}
                {timerStr && (
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-mono text-[10px] font-bold ${
                      isOvertime
                        ? 'bg-red-500/20 border-red-500/60 text-red-400 animate-pulse'
                        : 'bg-gray-800 border-gray-700 text-gray-200'
                    }`}
                  >
                    <Clock className={`w-2.5 h-2.5 ${isOvertime ? 'text-red-400' : 'text-gray-400'}`} />
                    {timerStr}
                  </span>
                )}
              </div>
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
            <div className="bg-[#0e1118] border border-gray-800 rounded-lg p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-800/80 border border-gray-700/80 text-gray-200 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  {trackInfo.location[lang]}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-800/80 border border-gray-700/80 text-gray-200 font-mono font-semibold">
                  <Route className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  {trackInfo.lengthKm}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-800/80 border border-gray-700/80 text-gray-200 font-semibold">
                  <CornerUpRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  {trackInfo.turns} {lang === 'en' ? 'turns' : 'curve'}
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                {trackInfo.description[lang]}
              </p>
            </div>
          )}

          {srv.online && settings && (
            <div className="bg-[#0e1118] border border-gray-800 rounded-lg p-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-800/80 border border-gray-700/80 text-gray-200">
                <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-gray-400">
                  {lang === 'en' ? 'Wait for players:' : 'Attesa piloti:'}
                </span>
                <strong className="font-mono text-white">
                  {settings.minWaitingSec}s–{settings.maxWaitingSec}s
                </strong>
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/30 text-red-300">
                <Timer className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="text-red-300/80">Overtime:</span>
                <strong className="font-mono text-red-200">
                  {srv.sessionPhase === 'GARA'
                    ? `${settings.raceOvertimeSec}s`
                    : srv.sessionPhase === 'QUALIFICHE'
                    ? `${settings.qualyOvertimeSec}s`
                    : srv.sessionPhase === 'WARMUP'
                    ? `${settings.warmupOvertimeSec}s`
                    : `${settings.practiceOvertimeSec}s`}
                </strong>
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="uppercase font-bold tracking-wider">{t.liveServers.modalPlayersTitle}</span>
            <span className="font-mono font-bold text-amber-400">
              {Math.max(srv.players || 0, srv.playersList?.length || 0)} / {srv.maxPlayers}
            </span>
          </div>

          {!srv.online ? (
            <div className="py-8 text-center text-sm text-gray-500">{t.liveServers.modalOffline}</div>
          ) : !srv.playersList || srv.playersList.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">{t.liveServers.modalEmpty}</div>
          ) : (
            <div className="border border-gray-800 rounded-lg divide-y divide-gray-800/80">
              {srv.playersList.map((p: any, i: number) => {
                const flagUrl = getCountryFlagUrl(p.nation);
                return (
                  <div
                    key={p.steamId || i}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-gray-800/30"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30 shrink-0">
                        #{p.number || '-'}
                      </span>
                      {flagUrl && (
                        <img
                          src={flagUrl}
                          alt={p.nation}
                          title={p.nation}
                          className="w-5 h-3.5 object-cover rounded-[2px] border border-gray-700 shrink-0"
                        />
                      )}
                      <span className="font-bold text-sm text-white truncate">{p.name}</span>
                    </div>
                    <div className="text-xs text-gray-400 shrink-0">
                      <CarHoverPreview carName={p.car} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
