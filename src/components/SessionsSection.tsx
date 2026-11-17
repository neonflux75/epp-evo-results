'use client';
import React from 'react';
import { ChevronRight, Car } from 'lucide-react';
import {
  TrackPreview,
  normalizeSessionCategory,
  getSessionTypeLabel,
} from '@/lib/evoUtils';
import { SessionDetailsModal } from './SessionDetailsModal';

interface SessionsSectionProps {
  tracks: any[];
  sessions: any[];
  selectedSessionTrack: string;
  selectedSessionType: string;
  onSessionTrackChange: (track: string) => void;
  onSessionTypeChange: (type: string) => void;
  selectedSession: any;
  loadingSession: boolean;
  expandedDriverGuid: string | null;
  onOpenSession: (id: number) => void;
  onCloseSession: () => void;
  onToggleDriverLaps: (guid: string | null) => void;
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
  expandedDriverGuid,
  onOpenSession,
  onCloseSession,
  onToggleDriverLaps,
}: SessionsSectionProps) {
  const sessionTracks = Array.from(
    new Set([
      ...(tracks || []).map((t: any) => t.track_name),
      ...(sessions || []).map((s: any) => s.track_name),
    ].filter(Boolean))
  ).sort() as string[];

  const filteredSessions = (sessions || []).filter(
    (s: any) =>
      (selectedSessionTrack === 'ALL' || s.track_name === selectedSessionTrack) &&
      (selectedSessionType === 'ALL' || normalizeSessionCategory(s.session_type) === selectedSessionType)
  );

  return (
    <>
      <section className="bg-[#131720] border border-gray-800/90 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white">Ultime Gare e Sessioni Disputate</h2>
            <p className="text-xs text-gray-400">
              Clicca su una sessione per aprire l&apos;ordine d&apos;arrivo e ispezionare i giri di ciascun pilota
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Circuito:</label>
              <select
                value={selectedSessionTrack}
                onChange={(e) => onSessionTrackChange(e.target.value)}
                className="bg-[#0b0d11] border border-gray-700 text-sm text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-500"
              >
                <option value="ALL">Tutti i tracciati</option>
                {sessionTracks.map((tr: string) => (
                  <option key={tr} value={tr}>
                    {tr}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1 bg-[#0b0d11] p-1 rounded-lg border border-gray-800">
              {[
                { id: 'ALL', label: 'Tutte' },
                { id: 'Race', label: 'Gare' },
                { id: 'Qualifying', label: 'Qualifiche' },
                { id: 'Practice', label: 'Pratica' },
                { id: 'Warmup', label: 'Warmup' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => onSessionTypeChange(item.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${
                    selectedSessionType === item.id
                      ? 'bg-red-600 text-white shadow'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-800/70">
          {filteredSessions.map((s: any) => {
            const cat = normalizeSessionCategory(s.session_type);
            const isQualy = cat === 'Qualifying';
            return (
              <div
                key={s.id}
                onClick={() => onOpenSession(s.id)}
                className="p-4 hover:bg-gray-800/40 cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <TrackPreview trackName={s.track_name} className="w-14 h-9" />
                  <span
                    className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider shrink-0 ${
                      cat === 'Race'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : isQualy
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : cat === 'Warmup'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {s.session_type}
                  </span>
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      {s.track_name} <span className="text-gray-500 font-normal">({s.server_name})</span>
                    </h3>
                    <p className="text-xs text-gray-400">
                      Data: {s.played_at} • Piloti partecipanti: <strong className="text-gray-200">{s.driver_count}</strong>
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  {s.winner_name && (
                    <div className="text-right">
                      <span
                        className={`text-[10px] uppercase block font-bold tracking-wider ${
                          isQualy ? 'text-purple-400' : 'text-gray-500'
                        }`}
                      >
                        {isQualy ? 'Pole Position' : '1° Classificato'}
                      </span>
                      <span className="text-xs font-bold text-amber-400 block">{s.winner_name}</span>
                      {s.winner_car && (
                        <span className="text-[11px] text-gray-400 flex items-center justify-end gap-1 mt-0.5">
                          <Car className="w-3 h-3 text-red-400 shrink-0" /> {s.winner_car}
                        </span>
                      )}
                    </div>
                  )}
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </div>
              </div>
            );
          })}
          {filteredSessions.length === 0 && (
            <div className="py-10 text-center text-gray-500 text-sm">
              Nessuna sessione trovata con i filtri selezionati (
              {selectedSessionTrack !== 'ALL' ? selectedSessionTrack : 'Tutti i tracciati'} •{' '}
              {getSessionTypeLabel(selectedSessionType)}).
            </div>
          )}
        </div>
      </section>

      <SessionDetailsModal
        selectedSession={selectedSession}
        loadingSession={loadingSession}
        expandedDriverGuid={expandedDriverGuid}
        onCloseSession={onCloseSession}
        onToggleDriverLaps={onToggleDriverLaps}
      />
    </>
  );
}
