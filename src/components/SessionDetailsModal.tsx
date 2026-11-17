'use client';
import React from 'react';
import { X } from 'lucide-react';
import { TrackPreview, normalizeSessionCategory } from '@/lib/evoUtils';
import { useLanguage } from '@/context/LanguageContext';
import { SessionResultRow } from './SessionResultRow';

interface SessionDetailsModalProps {
  selectedSession: any;
  loadingSession: boolean;
  expandedDriverGuid: string | null;
  onCloseSession: () => void;
  onToggleDriverLaps: (guid: string | null) => void;
}

export function SessionDetailsModal({
  selectedSession,
  loadingSession,
  expandedDriverGuid,
  onCloseSession,
  onToggleDriverLaps,
}: SessionDetailsModalProps) {
  const { t } = useLanguage();
  if (!selectedSession && !loadingSession) return null;

  const sessCat = normalizeSessionCategory(selectedSession?.session?.session_type);
  const isRace = sessCat === 'Race';
  const isQualy = sessCat === 'Qualifying';

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCloseSession}
    >
      <div
        className="bg-[#131720] border border-gray-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <TrackPreview trackName={selectedSession?.session?.track_name} className="w-16 h-11" />
            <div>
              <h3 className="text-lg font-bold text-white">
                {selectedSession?.session?.track_name} — {selectedSession?.session?.session_type}
              </h3>
              <p className="text-xs text-gray-400">
                {selectedSession?.session?.server_name} • {selectedSession?.session?.played_at}
              </p>
            </div>
          </div>
          <button onClick={onCloseSession} className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

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
