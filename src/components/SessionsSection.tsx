'use client';
import React, { useState } from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import {
  TrackPreview,
  normalizeSessionCategory,
  getSessionTypeLabel,
  formatLocalDateTime,
} from '@/lib/evoUtils';
import { useLanguage } from '@/context/LanguageContext';

interface SessionsSectionProps {
  tracks?: any[];
  sessions: any[];
  selectedSessionTrack?: string;
  selectedSessionType?: string;
  onSessionTrackChange?: (v: string) => void;
  onSessionTypeChange?: (v: string) => void;
  onOpenSession: (sessionId: number) => void;
}

export function SessionsSection({
  tracks,
  sessions,
  selectedSessionTrack,
  selectedSessionType,
  onSessionTrackChange,
  onSessionTypeChange,
  onOpenSession,
}: SessionsSectionProps) {
  const { t, lang } = useLanguage();
  const [localTrackFilter, setLocalTrackFilter] = useState<string>('ALL');
  const [localTypeFilter, setLocalTypeFilter] = useState<string>('ALL');

  const trackFilter = selectedSessionTrack !== undefined ? selectedSessionTrack : localTrackFilter;
  const typeFilter = selectedSessionType !== undefined ? selectedSessionType : localTypeFilter;

  const setTrackFilter = (val: string) => {
    if (onSessionTrackChange) onSessionTrackChange(val);
    else setLocalTrackFilter(val);
  };

  const setTypeFilter = (val: string) => {
    if (onSessionTypeChange) onSessionTypeChange(val);
    else setLocalTypeFilter(val);
  };

  const availableTracks = tracks && tracks.length > 0
    ? tracks.map((tr: any) => (typeof tr === 'string' ? tr : tr.track_name)).filter(Boolean)
    : (Array.from(
        new Set((sessions || []).map((s: any) => s.track_name).filter(Boolean))
      ).sort() as string[]);

  const filteredSessions = (sessions || []).filter((s: any) => {
    const matchTrack = trackFilter === 'ALL' || s.track_name === trackFilter;
    const matchType =
      typeFilter === 'ALL' || normalizeSessionCategory(s.session_type) === typeFilter;
    return matchTrack && matchType;
  });

  const filterButtons = [
    { id: 'ALL', label: lang === 'en' ? 'All' : 'Tutte' },
    { id: 'RACE', label: lang === 'en' ? 'Races' : 'Gare' },
    { id: 'QUALIFY', label: lang === 'en' ? 'Qualifying' : 'Qualifiche' },
    { id: 'PRACTICE', label: lang === 'en' ? 'Practice' : 'Pratica' },
    { id: 'WARMUP', label: 'Warmup' },
  ];

  return (
    <section className="bg-[#131720] border border-gray-800/90 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-red-500" />
            {lang === 'en' ? 'Recent Races & Sessions' : 'Ultime Gare e Sessioni Disputate'}
          </h2>
          <p className="text-xs text-gray-400">
            {lang === 'en'
              ? 'Click on a session to open the finishing order and inspect each driver’s laps'
              : 'Clicca su una sessione per aprire l’ordine d’arrivo e ispezionare i giri di ciascun pilota'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">{t.common.track}:</label>
            <select
              value={trackFilter}
              onChange={(e) => setTrackFilter(e.target.value)}
              className="bg-[#0b0d11] border border-gray-700 text-xs sm:text-sm text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-500"
            >
              <option value="ALL">{lang === 'en' ? 'All tracks' : 'Tutti i tracciati'}</option>
              {availableTracks.map((tr: string) => (
                <option key={tr} value={tr}>
                  {tr}
                </option>
              ))}
            </select>
          </div>

          <div className="inline-flex items-center bg-[#0b0d11] border border-gray-800 rounded-lg p-0.5 text-xs">
            {filterButtons.map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setTypeFilter(btn.id)}
                className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                  typeFilter === btn.id
                    ? 'bg-red-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-800/70">
        {filteredSessions.map((s: any) => {
          const cat = normalizeSessionCategory(s.session_type);
          const isRace = cat === 'RACE';
          const badgeStyle = isRace
            ? 'bg-red-500/15 text-red-400 border-red-500/40'
            : cat === 'QUALIFY'
            ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
            : 'bg-sky-500/15 text-sky-400 border-sky-500/40';

          return (
            <div
              key={s.id}
              onClick={() => onOpenSession(s.id)}
              className="p-4 hover:bg-gray-800/30 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <TrackPreview trackName={s.track_name} className="w-16 h-10 shrink-0" />
                <span
                  className={`px-2 py-0.5 rounded border text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${badgeStyle}`}
                >
                  {getSessionTypeLabel(s.session_type)}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">
                    {s.track_name}{' '}
                    <span className="font-normal text-gray-400">({s.server_name})</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {lang === 'en' ? 'Date' : 'Data'}: {formatLocalDateTime(s.played_at)} •{' '}
                    {lang === 'en' ? 'Drivers' : 'Piloti partecipanti'}:{' '}
                    <strong className="text-gray-300">{s.driver_count}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 shrink-0">
                {s.winner_name && (
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      {isRace ? (lang === 'en' ? '1ST PLACE' : '1° CLASSIFICATO') : 'POLE POSITION'}
                    </div>
                    <div className="text-sm font-bold text-white">{s.winner_name}</div>
                    {s.winner_car && (
                      <div className="text-[11px] text-gray-400">{s.winner_car}</div>
                    )}
                  </div>
                )}
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </div>
            </div>
          );
        })}

        {filteredSessions.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-500">
            {lang === 'en' ? 'No sessions found.' : 'Nessuna sessione trovata.'}
          </div>
        )}
      </div>
    </section>
  );
}
