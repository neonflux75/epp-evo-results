'use client';
import React, { useMemo } from 'react';
import { Calendar, ChevronRight } from 'lucide-react';
import { TrackPreview, formatLocalDateTime } from '@/lib/evoUtils';
import { useLanguage } from '@/context/LanguageContext';
import { SessionDetailsModal } from './SessionDetailsModal';
import { CarHoverPreview } from './CarHoverPreview';

interface SessionsSectionProps {
  tracks?: any[];
  sessions: any[];
  selectedSessionTrack: string;
  selectedSessionType: string;
  onSessionTrackChange: (v: string) => void;
  onSessionTypeChange: (v: string) => void;
  selectedSession: any;
  loadingSession: boolean;
  onOpenSession: (sessionId: number) => void;
  onCloseSession: () => void;
  expandedDriverGuid: string | null;
  onToggleDriverLaps: (guid: string | null) => void;
}

type SessionKind = 'RACE' | 'QUALIFY' | 'WARMUP' | 'PRACTICE';

function detectSessionKind(rawType?: string): SessionKind {
  const s = String(rawType || '').toLowerCase();
  if (s.includes('race') || s.includes('gara')) return 'RACE';
  if (s.includes('qual')) return 'QUALIFY';
  if (s.includes('warm')) return 'WARMUP';
  return 'PRACTICE';
}

const KIND_PRIORITY: Record<SessionKind, number> = {
  PRACTICE: 1,
  QUALIFY: 2,
  WARMUP: 3,
  RACE: 4,
};

interface GroupedEvent {
  key: string;
  server_name: string;
  track_name: string;
  played_at: string;
  driver_count: number;
  sessions: any[];
  primarySession: any;
  primaryKind: SessionKind;
}

export function SessionsSection({
  tracks,
  sessions,
  selectedSessionTrack,
  selectedSessionType,
  onSessionTrackChange,
  onSessionTypeChange,
  selectedSession,
  loadingSession,
  onOpenSession,
  onCloseSession,
  expandedDriverGuid,
  onToggleDriverLaps,
}: SessionsSectionProps) {
  const { t, lang } = useLanguage();

  const availableTracks =
    tracks && tracks.length > 0
      ? tracks.map((tr: any) => (typeof tr === 'string' ? tr : tr.track_name)).filter(Boolean)
      : (Array.from(
          new Set((sessions || []).map((s: any) => s.track_name).filter(Boolean))
        ).sort() as string[]);

  const groupedEvents = useMemo(() => {
    const sorted = [...(sessions || [])].sort((a, b) => {
      const ta = Date.parse(String(a.played_at || '')) || 0;
      const tb = Date.parse(String(b.played_at || '')) || 0;
      return tb !== ta ? tb - ta : Number(b.id) - Number(a.id);
    });

    const events: GroupedEvent[] = [];
    const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

    for (const s of sorted) {
      const kind = detectSessionKind(s.session_type);
      const sTime = Date.parse(String(s.played_at || '')) || 0;
      const last = events[events.length - 1];

      const canMerge =
        last &&
        last.server_name === s.server_name &&
        last.track_name === s.track_name &&
        !last.sessions.some((existing) => detectSessionKind(existing.session_type) === kind) &&
        Math.abs((Date.parse(String(last.played_at || '')) || 0) - sTime) <= THREE_HOURS_MS;

      if (canMerge) {
        last.sessions.push(s);
        last.driver_count = Math.max(Number(last.driver_count || 0), Number(s.driver_count || 0));
      } else {
        events.push({
          key: `evt-${s.id}`,
          server_name: s.server_name,
          track_name: s.track_name,
          played_at: s.played_at,
          driver_count: Number(s.driver_count || 0),
          sessions: [s],
          primarySession: s,
          primaryKind: kind,
        });
      }
    }

    for (const ev of events) {
      ev.sessions.sort(
        (a, b) => KIND_PRIORITY[detectSessionKind(a.session_type)] - KIND_PRIORITY[detectSessionKind(b.session_type)]
      );
      const best = [...ev.sessions].sort(
        (a, b) => KIND_PRIORITY[detectSessionKind(b.session_type)] - KIND_PRIORITY[detectSessionKind(a.session_type)]
      )[0];
      ev.primarySession = best;
      ev.primaryKind = detectSessionKind(best.session_type);
    }

    return events;
  }, [sessions]);
  const filteredEvents = groupedEvents
    .filter((ev) => {
      const matchTrack = selectedSessionTrack === 'ALL' || ev.track_name === selectedSessionTrack;
      const matchType =
        selectedSessionType === 'ALL' ||
        ev.sessions.some((s) => detectSessionKind(s.session_type) === selectedSessionType);
      return matchTrack && matchType;
    })
    .slice(0, 20);

  const filterButtons = [
    { id: 'ALL', label: t.sessions.filters.ALL },
    { id: 'RACE', label: t.sessions.filters.Race },
    { id: 'QUALIFY', label: t.sessions.filters.Qualifying },
    { id: 'PRACTICE', label: t.sessions.filters.Practice },
    { id: 'WARMUP', label: t.sessions.filters.Warmup },
  ];

  const getBadgeProps = (kind: SessionKind) => {
    if (kind === 'RACE') {
      return {
        label: lang === 'en' ? 'RACE' : 'GARA',
        cls: 'bg-red-500/15 text-red-400 border-red-500/40',
      };
    }
    if (kind === 'QUALIFY') {
      return {
        label: lang === 'en' ? 'QUALIFYING' : 'QUALIFICHE',
        cls: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
      };
    }
    if (kind === 'WARMUP') {
      return {
        label: 'WARMUP',
        cls: 'bg-purple-500/15 text-purple-400 border-purple-500/40',
      };
    }
    return {
      label: lang === 'en' ? 'PRACTICE' : 'PRATICA',
      cls: 'bg-sky-500/15 text-sky-400 border-sky-500/40',
    };
  };

  const getRightHeaderLabel = (kind: SessionKind) => {
    if (kind === 'RACE') {
      return lang === 'en' ? '1ST PLACE' : '1° CLASSIFICATO';
    }
    if (kind === 'QUALIFY') {
      return 'POLE POSITION';
    }
    return lang === 'en' ? 'BEST LAP' : 'MIGLIOR TEMPO';
  };

  return (
    <>
      <section className="bg-[#131720] border border-gray-800/90 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-500" />
              {t.sessions.title}
            </h2>
            <p className="text-xs text-gray-400">{t.sessions.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">{t.common.track}:</label>
              <select
                value={selectedSessionTrack}
                onChange={(e) => onSessionTrackChange(e.target.value)}
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
                  onClick={() => onSessionTypeChange(btn.id)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    selectedSessionType === btn.id
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
          {filteredEvents.map((ev) => {
            const targetSession =
              selectedSessionType !== 'ALL'
                ? ev.sessions.find((s) => detectSessionKind(s.session_type) === selectedSessionType) || ev.primarySession
                : ev.primarySession;
            const targetKind = detectSessionKind(targetSession.session_type);

            return (
              <div
                key={ev.key}
                onClick={() => onOpenSession(targetSession.id)}
                className="p-4 hover:bg-gray-800/30 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <TrackPreview trackName={ev.track_name} className="w-16 h-10 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      {ev.sessions.map((sub) => {
                        const subKind = detectSessionKind(sub.session_type);
                        const badge = getBadgeProps(subKind);
                        return (
                          <span
                            key={sub.id}
                            className={`px-2 py-0.5 rounded border text-[10px] font-extrabold uppercase tracking-wider ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        );
                      })}
                    </div>
                    <div className="text-sm font-bold text-white truncate">
                      {ev.track_name}{' '}
                      <span className="font-normal text-gray-400">({ev.server_name})</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {lang === 'en' ? 'Date' : 'Data'}: {formatLocalDateTime(ev.played_at)} •{' '}
                      {t.sessions.participants}:{' '}
                      <strong className="text-gray-300">{ev.driver_count}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 shrink-0">
                  {targetSession.winner_name && (
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        {getRightHeaderLabel(targetKind)}
                      </div>
                      <div className="text-sm font-bold text-white">{targetSession.winner_name}</div>
                      {targetSession.winner_car && (
                        <div className="text-[11px] text-gray-400" onClick={(e) => e.stopPropagation()}>
                          <CarHoverPreview carName={targetSession.winner_car} showIcon={false} />
                        </div>
                      )}
                    </div>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </div>
              </div>
            );
          })}

          {filteredEvents.length === 0 && (
            <div className="py-10 text-center text-sm text-gray-500">{t.sessions.empty}</div>
          )}
        </div>
      </section>

      <SessionDetailsModal
        selectedSession={selectedSession}
        loadingSession={loadingSession}
        onCloseSession={onCloseSession}
        expandedDriverGuid={expandedDriverGuid}
        onToggleDriverLaps={onToggleDriverLaps}
        onSwitchSession={onOpenSession}
      />
    </>
  );
}
