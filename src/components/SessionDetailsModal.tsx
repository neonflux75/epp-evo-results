'use client';
import React, { useState, useEffect } from 'react';
import { X, Activity } from 'lucide-react';
import { TrackPreview, normalizeSessionCategory, formatLocalDateTime } from '@/lib/evoUtils';
import { useLanguage } from '@/context/LanguageContext';
import { SessionResultRow } from './SessionResultRow';

interface SessionDetailsModalProps {
  selectedSession: any;
  loadingSession: boolean;
  expandedDriverGuid: string | null;
  onCloseSession: () => void;
  onToggleDriverLaps: (guid: string | null) => void;
  onSwitchSession?: (sessionId: number) => void;
}

type TabKind = 'PRACTICE' | 'QUALIFY' | 'WARMUP' | 'RACE';

function getTabKind(rawType?: string): TabKind {
  const s = String(rawType || '').toLowerCase();
  if (s.includes('race') || s.includes('gara')) return 'RACE';
  if (s.includes('qual')) return 'QUALIFY';
  if (s.includes('warm')) return 'WARMUP';
  return 'PRACTICE';
}

const TAB_ORDER: TabKind[] = ['PRACTICE', 'QUALIFY', 'WARMUP', 'RACE'];

export function SessionDetailsModal({
  selectedSession,
  loadingSession,
  expandedDriverGuid,
  onCloseSession,
  onToggleDriverLaps,
  onSwitchSession,
}: SessionDetailsModalProps) {
  const { t, lang } = useLanguage();
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    if (selectedSession?.session?.id) {
      setActiveId(Number(selectedSession.session.id));
    }
  }, [selectedSession?.session?.id]);

  if (!selectedSession && !loadingSession) return null;

  const relatedSessions: any[] = Array.isArray(selectedSession?.relatedSessions)
    ? selectedSession.relatedSessions
    : selectedSession?.session
    ? [selectedSession.session]
    : [];

  const availableTabs = TAB_ORDER.map((kind) => {
    const match = relatedSessions.find((rs) => getTabKind(rs.session_type) === kind);
    return match ? { kind, session: match } : null;
  }).filter(Boolean) as { kind: TabKind; session: any }[];

  const getTabLabel = (kind: TabKind) => {
    if (kind === 'RACE') return lang === 'en' ? 'RACE' : 'GARA';
    if (kind === 'QUALIFY') return lang === 'en' ? 'QUALIFYING' : 'QUALIFICHE';
    if (kind === 'WARMUP') return 'WARMUP';
    return lang === 'en' ? 'PRACTICE' : 'PRATICA';
  };

  const getTabClasses = (kind: TabKind, isSelected: boolean) => {
    if (kind === 'RACE') {
      return isSelected
        ? 'bg-red-500/25 text-red-300 border-red-500 ring-1 ring-red-500/50 shadow-sm shadow-red-900/40'
        : 'bg-red-500/10 text-red-400/80 border-red-500/30 hover:bg-red-500/20 hover:text-red-300';
    }
    if (kind === 'QUALIFY') {
      return isSelected
        ? 'bg-amber-500/25 text-amber-300 border-amber-500 ring-1 ring-amber-500/50 shadow-sm shadow-amber-900/40'
        : 'bg-amber-500/10 text-amber-400/80 border-amber-500/30 hover:bg-amber-500/20 hover:text-amber-300';
    }
    if (kind === 'WARMUP') {
      return isSelected
        ? 'bg-purple-500/25 text-purple-300 border-purple-500 ring-1 ring-purple-500/50 shadow-sm shadow-purple-900/40'
        : 'bg-purple-500/10 text-purple-400/80 border-purple-500/30 hover:bg-purple-500/20 hover:text-purple-300';
    }
    return isSelected
      ? 'bg-sky-500/25 text-sky-300 border-sky-500 ring-1 ring-sky-500/50 shadow-sm shadow-sky-900/40'
      : 'bg-sky-500/10 text-sky-400/80 border-sky-500/30 hover:bg-sky-500/20 hover:text-sky-300';
  };

  const sessCat = normalizeSessionCategory(selectedSession?.session?.session_type);
  const isRace = sessCat === 'Race';
  const isQualy = sessCat === 'Qualifying';

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCloseSession}
    >
      <div
        className="bg-[#131720] border border-gray-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <TrackPreview trackName={selectedSession?.session?.track_name} className="w-16 h-11 shrink-0" />
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-white truncate">
                {selectedSession?.session?.track_name}
              </h3>
              <p className="text-xs text-gray-400 truncate">
                {selectedSession?.session?.server_name} • {formatLocalDateTime(selectedSession?.session?.played_at)}
              </p>
            </div>
          </div>
          <button
            onClick={onCloseSession}
            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {availableTabs.length > 0 && (
          <div className="px-4 pt-3 pb-2.5 bg-[#0e1118] border-b border-gray-800 flex items-center gap-2 flex-wrap">
            {availableTabs.map(({ kind, session: tabSess }) => {
              const isSelected = Number(tabSess.id) === Number(activeId || selectedSession?.session?.id);
              return (
                <button
                  key={tabSess.id}
                  type="button"
                  disabled={loadingSession || isSelected}
                  onClick={() => {
                    setActiveId(Number(tabSess.id));
                    if (onSwitchSession) onSwitchSession(Number(tabSess.id));
                  }}
                  className={`px-3 py-1 rounded-md border text-[11px] font-extrabold uppercase tracking-wider transition cursor-pointer ${getTabClasses(kind, isSelected)}`}
                >
                  {getTabLabel(kind)}
                </button>
              );
            })}
            {loadingSession && (
              <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 font-semibold ml-2">
                <Activity className="w-3.5 h-3.5 animate-spin" />
              </span>
            )}
          </div>
        )}

        <div className="p-4 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {t.sessions.modalTitle}
            </h4>
            <span className="text-[11px] text-gray-500">{t.sessions.modalHint}</span>
          </div>

          <div className="overflow-x-auto border border-gray-800 rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0e1118] text-[11px] uppercase text-gray-400">
                <tr>
                  <th className="py-2.5 px-3">{t.common.pos}</th>
                  <th className="py-2.5 px-3">{t.common.driver}</th>
                  <th className="py-2.5 px-3">{t.common.car}</th>
                  <th className="py-2.5 px-3 text-center">{t.common.laps}</th>
                  <th className="py-2.5 px-3 text-right">{t.common.bestLap}</th>
                  <th className="py-2.5 px-3 text-right">{t.common.totalTime}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {selectedSession?.results?.map((r: any) => {
                  const isExpanded = expandedDriverGuid === r.driver_guid;
                  const driverLaps = (selectedSession?.laps || []).filter(
                    (l: any) => l.driver_guid === r.driver_guid
                  );
                  return (
                    <SessionResultRow
                      key={r.id || r.driver_guid}
                      r={r}
                      isRace={isRace}
                      isQualy={isQualy}
                      isExpanded={isExpanded}
                      driverLaps={driverLaps}
                      onToggle={() => onToggleDriverLaps(isExpanded ? null : r.driver_guid)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
