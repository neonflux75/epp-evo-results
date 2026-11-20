'use client';
import React from 'react';
import { Users, X, Clock, MapPin, Route, CornerUpRight, Timer } from 'lucide-react';
import { NationFlag, TrackPreview } from '@/lib/evoUtils';
import { useLanguage } from '@/context/LanguageContext';
import { CarHoverPreview } from '@/components/CarHoverPreview';
import tracksInfoData from '@/config/tracksInfo.json';

interface TrackDetailInfo {
  location: { it: string; en: string };
  lengthKm: string;
  turns: number;
  description: { it: string; en: string };
}

const TRACK_ALIASES: Record<string, string> = {
  monza: 'monza',
  autodromo: 'monza',
  imola: 'imola',
  enzo: 'imola',
  brands: 'brands_hatch',
  indy: 'brands_hatch',
  spa: 'spa',
  francorchamps: 'spa',
  suzuka: 'suzuka',
  laguna: 'laguna_seca',
  seca: 'laguna_seca',
  bathurst: 'bathurst',
  panorama: 'bathurst',
  mount: 'bathurst',
  nordschleife: 'nordschleife',
  '24h': 'nordschleife',
  nurburgring: 'nurburgring',
  spielberg: 'red_bull_ring',
  redbull: 'red_bull_ring',
  donington: 'donington',
  cota: 'cota',
  americas: 'cota',
  austin: 'cota',
  fuji: 'fuji',
  watkins: 'watkins_glen',
  glen: 'watkins_glen',
  atlanta: 'road_atlanta',
  barcelona: 'barcelona',
  catalunya: 'barcelona',
  montmelo: 'barcelona',
  silverstone: 'silverstone',
  ricard: 'paul_ricard',
  castellet: 'paul_ricard',
  misano: 'misano',
  kyalami: 'kyalami',
  zandvoort: 'zandvoort',
};

function resolveTrackInfo(trackName?: string): TrackDetailInfo | null {
  if (!trackName) return null;
  const db = tracksInfoData as Record<string, TrackDetailInfo>;
  const raw = trackName.toLowerCase().trim();
  if (db[raw]) return db[raw];

  const norm = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^ks_/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  if (!norm) return null;
  const under = norm.replace(/\s+/g, '_');
  if (db[under]) return db[under];

  for (const key of Object.keys(db)) {
    if (norm.includes(key.replace(/_/g, ' '))) return db[key];
  }

  for (const [alias, targetKey] of Object.entries(TRACK_ALIASES)) {
    if (norm.includes(alias) && db[targetKey]) {
      return db[targetKey];
    }
  }

  return null;
}

function formatSeconds(sec?: number) {
  const n = Number(sec || 0);
  if (n <= 0) return '0s';
  if (n < 60) return `${n}s`;
  const m = Math.floor(n / 60);
  const s = n % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function ServerModal({
  srv,
  timerStr,
  isOvertime = false,
  onClose,
}: {
  srv: any;
  timerStr: string | null;
  isOvertime?: boolean;
  onClose: () => void;
}) {
  const { t, lang } = useLanguage();
  if (!srv) return null;

  const phase = srv.online
    ? t.liveServers.phases[srv.sessionPhase as keyof typeof t.liveServers.phases] || srv.sessionPhase
    : t.common.offline;
  const count = Math.max(srv.players || 0, srv.playersList?.length || 0);
  const trackInfo = resolveTrackInfo(srv.track);
  const settings = srv.serverSettings || null;

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#131720] border border-gray-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-800 flex items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  srv.online ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400'
                }`}
              >
                {phase}
              </span>
              {timerStr && (
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
            <h3 className="text-base font-bold text-white mt-1">{srv.name}</h3>
            <p className="text-xs text-gray-400">
              {t.common.track}:{' '}
              <strong className="text-gray-200">{srv.track || t.common.trackFallback}</strong> •{' '}
              {t.liveServers.connectedDrivers}:{' '}
              <strong className="text-amber-400">
                {count}/{srv.maxPlayers}
              </strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          {settings && (
            <div className="bg-[#0e1118]/90 border border-gray-800/90 rounded-lg p-3 flex flex-wrap items-center gap-2 text-xs">
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            <div className="lg:col-span-7 flex flex-col">
              {srv.playersList?.length > 0 ? (
                <div className="border border-gray-800 rounded-lg overflow-visible flex-1">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#0e1118] text-[11px] uppercase text-gray-400">
                      <tr>
                        <th className="py-2 px-3 w-14">{t.liveServers.raceNumber}</th>
                        <th className="py-2 px-3">{t.common.driver}</th>
                        <th className="py-2 px-3">{t.common.vehicle}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {srv.playersList.map((p: any) => (
                        <tr key={p.steamId} className="hover:bg-gray-800/30">
                          <td className="py-1.5 px-3 font-mono font-bold text-amber-400 text-xs">
                            #{p.number}
                          </td>
                          <td className="py-1.5 px-3 font-semibold text-white text-xs sm:text-sm">
                            <span className="inline-flex items-center">
                              {p.name}
                              <NationFlag nation={p.nation} />
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-xs text-gray-300">
                            <CarHoverPreview carName={p.car} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="border border-gray-800 rounded-lg flex-1 min-h-[260px] flex flex-col items-center justify-center p-6 text-center text-gray-400 space-y-1">
                  <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="font-semibold text-gray-300">{t.liveServers.noDriversTitle}</p>
                  <p className="text-xs text-gray-500">{t.liveServers.noDriversSub}</p>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 flex flex-col justify-between min-h-[340px] lg:min-h-[460px] px-2 gap-3">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-gray-400 pb-2 border-b border-gray-800/70">
                <span className="inline-flex items-center gap-1.5 font-bold">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  {t.common.track}
                </span>
                <span className="text-gray-300 font-semibold truncate max-w-[200px]">
                  {srv.track || t.common.trackFallback}
                </span>
              </div>

              <div
                className="flex-1 flex items-center justify-center p-4 overflow-hidden"
                style={{
                  filter:
                    'brightness(1.2) drop-shadow(0 0 6px rgba(239, 68, 68, 0.95)) drop-shadow(0 0 18px rgba(220, 38, 38, 0.75))',
                }}
              >
                <TrackPreview
                  trackName={srv.track}
                  variant="modal"
                  className="w-full h-full max-h-[230px] lg:max-h-[270px]"
                />
              </div>

              {trackInfo && (
                <div className="bg-[#0e1118]/90 border border-gray-800/90 rounded-lg p-3 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-gray-400 font-medium truncate">
                      {lang === 'en' ? trackInfo.location.en : trackInfo.location.it}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-800/90 border border-gray-700/80 text-gray-200 font-mono font-bold">
                        <Route className="w-3 h-3 text-red-400" />
                        {trackInfo.lengthKm}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-800/90 border border-gray-700/80 text-gray-200 font-mono font-bold">
                        <CornerUpRight className="w-3 h-3 text-amber-400" />
                        {trackInfo.turns} {lang === 'en' ? 'turns' : 'curve'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {lang === 'en' ? trackInfo.description.en : trackInfo.description.it}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
