'use client';
import React, { useState } from 'react';
import { Flag, ChevronRight } from 'lucide-react';
import {
  TrackPreview,
  normalizeSessionCategory,
  getSessionTypeLabel,
  formatLocalDateTime,
} from '@/lib/evoUtils';
import { useLanguage } from '@/context/LanguageContext';

interface SessionsSectionProps {
  sessions: any[];
  onOpenSession: (id: number) => void;
}

export function SessionsSection({ sessions, onOpenSession }: SessionsSectionProps) {
  const { t, lang } = useLanguage();
  const [sessionFilter, setSessionFilter] = useState<'ALL' | 'RACE' | 'QUALIFY' | 'PRACTICE' | 'WARMUP'>('ALL');
  const [selectedTrack, setSelectedTrack] = useState<string>('ALL');

  const availableTracks = Array.from(
    new Set((sessions || []).map((s: any) => s.track_name).filter(Boolean))
  ).sort() as string[];

  const effectiveTrack =
    selectedTrack === 'ALL' || availableTracks.includes(selectedTrack) ? selectedTrack : 'ALL';

  const filteredSessions = (sessions || []).filter((s: any) => {
    const matchesCategory =
      sessionFilter === 'ALL' ? true : normalizeSessionCategory(s.session_type) === sessionFilter;
    const matchesTrack =
      effectiveTrack === 'ALL' ? true : s.track_name === effectiveTrack;
    return matchesCategory && matchesTrack;
  });

  const filterButtons = [
    { id: 'ALL' as const, label: t.sessions.filters.all },
    { id: 'RACE' as const, label: t.sessions.filters.race },
    { id: 'QUALIFY' as const, label: t.sessions.filters.qualify },
    { id: 'PRACTICE' as const, label: t.sessions.filters.practice },
    { id: 'WARMUP' as const, label: 'Warmup' },
  ];

  return (
    <section className="bg-[#131720] border border-gray-800/90 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">{t.sessions.title}</h2>
          <p className="text-xs text-gray-400">{t.sessions.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">{t.common.track}:</label>
            <select
              value={effectiveTrack}
              onChange={(e) => setSelectedTrack(e.target.value)}
              className="bg-[#0b0d11] border border-gray-700 text-xs sm:text-sm text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-500 max-w-[200px]"
            >
              <option value="ALL">{lang === 'en' ? 'All tracks' : 'Tutti i tracciati'}</option>
              {availableTracks.map((tr: string) => (
                <option key={tr} value={tr}>
                  {tr}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center bg-[#0b0d11] border border-gray-800 rounded-lg p-1 gap-1">
            {filterButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => setSessionFilter(btn.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                  sessionFilter === btn.id
                    ? 'bg-red-600 text-white shadow'
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
          const isQualy = cat === 'QUALIFY';

          return (
            <div
              key={s.id}
              onClick={() => onOpenSession(s.id)}
              className="p-4 hover:bg-gray-800/35 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition group"
            >
              <div className="flex items-center gap-3.5">
                <TrackPreview trackName={s.track_name} className="w-16 h-11" />
                <span
                  className={`px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider shrink-0 ${
                    isRace
                      ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                      : isQualy
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                  }`}
                >
                  {getSessionTypeLabel(s.session_type)}
                </span>
                <div>
                  <h3 className="font-bold text-white group-hover:text-red-400 transition">
                    {s.track_name}{' '}
                    <span className="text-gray-400 font-normal text-xs">({s.server_name})</span>
                  </h3>
                  <p className="text-xs text-gray-500">
                    {t.sessions.date}: {formatLocalDateTime(s.played_at)} • {t.sessions.participants}:{' '}
                    <strong className="text-gray-300">{s.driver_count}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4">
                {s.winner_name && (
                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold">
                      {isRace ? t.sessions.winner : t.sessions.polePosition}
                    </p>
                    <p className="text-sm font-bold text-white">{s.winner_name}</p>
                    <p className="text-[11px] text-gray-400">{s.winner_car}</p>
                  </div>
                )}
                <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition" />
              </div>
            </div>
          );
        })}

        {filteredSessions.length === 0 && (
          <div className="p-10 text-center text-gray-500 flex flex-col items-center gap-2">
            <Flag className="w-6 h-6 text-gray-600" />
            <p>{t.sessions.empty}</p>
          </div>
        )}
      </div>
    </section>
  );
}
