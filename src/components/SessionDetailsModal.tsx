'use client';
import React from 'react';
import { ChevronRight, ChevronDown, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { NationFlag, TrackPreview, formatMs, normalizeSessionCategory } from '@/lib/evoUtils';

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
  if (!selectedSession && !loadingSession) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onCloseSession}>
      <div className="bg-[#131720] border border-gray-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <TrackPreview trackName={selectedSession?.session?.track_name} className="w-16 h-11" />
            <div>
              <h3 className="text-lg font-bold text-white">{selectedSession?.session?.track_name} — {selectedSession?.session?.session_type}</h3>
              <p className="text-xs text-gray-400">{selectedSession?.session?.server_name} • {selectedSession?.session?.played_at}</p>
            </div>
          </div>
          <button onClick={onCloseSession} className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Ordine d&apos;Arrivo / Classifica Sessione</h4>
            <span className="text-[11px] text-gray-500">Clicca su un pilota per vedere tutti i suoi giri e settori</span>
          </div>
          <div className="overflow-x-auto border border-gray-800 rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0e1118] text-[11px] uppercase text-gray-400">
                <tr>
                  <th className="py-2.5 px-3">Pos</th>
                  <th className="py-2.5 px-3">Pilota</th>
                  <th className="py-2.5 px-3">Auto</th>
                  <th className="py-2.5 px-3 text-center">Giri</th>
                  <th className="py-2.5 px-3 text-right">Miglior Giro</th>
                  <th className="py-2.5 px-3 text-right">Tempo Totale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {selectedSession?.results?.map((r: any) => {
                  const isExpanded = expandedDriverGuid === r.driver_guid;
                  const driverLaps = (selectedSession?.laps || []).filter((l: any) => l.driver_guid === r.driver_guid);
                  const sessCat = normalizeSessionCategory(selectedSession?.session?.session_type);
                  const isRace = sessCat === 'Race';
                  const isQualy = sessCat === 'Qualifying';
                  const gridPos = typeof r.grid_position === 'number' ? r.grid_position : null;
                  const posDelta = isRace && gridPos !== null ? gridPos - r.position : 0;
                  return (
                    <React.Fragment key={r.id}>
                      <tr onClick={() => onToggleDriverLaps(isExpanded ? null : r.driver_guid)} className={`cursor-pointer transition ${isExpanded ? 'bg-gray-800/60' : 'hover:bg-gray-800/30'}`}>
                        <td className="py-2.5 px-3 font-mono font-bold whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {isQualy && r.position === 1 ? (
                              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-extrabold uppercase tracking-wide">Pole Position</span>
                            ) : (
                              <span className="text-amber-400">P{r.position}</span>
                            )}
                            {isRace && gridPos !== null && posDelta > 0 && (
                              <span title={`Partenza in griglia: P${gridPos} → Arrivo: P${r.position} (+${posDelta} posizioni)`} className="inline-flex items-center gap-0.5 text-emerald-400 cursor-help select-none">
                                <span className="text-[11px] leading-none">▲</span>
                                <span className="text-[10px] font-bold">+{posDelta}</span>
                              </span>
                            )}
                            {isRace && gridPos !== null && posDelta < 0 && (
                              <span title={`Partenza in griglia: P${gridPos} → Arrivo: P${r.position} (${posDelta} posizioni)`} className="inline-flex items-center gap-0.5 text-red-500 cursor-help select-none">
                                <span className="text-[11px] leading-none">▼</span>
                                <span className="text-[10px] font-bold">{posDelta}</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-white">
                          <div className="flex items-center gap-1.5">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-red-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />}
                            <span>{r.driver_name}</span>
                            <NationFlag nation={r.nation} />
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-xs text-gray-300">{r.car_model}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-gray-300">{r.laps_completed}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-400">{formatMs(r.best_lap_ms)}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-gray-400">{formatMs(r.total_time_ms)}</td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-[#0b0d11] p-3 border-t border-gray-800">
                            <div className="text-[11px] uppercase tracking-wider text-gray-400 font-bold mb-2">Giri registrati da {r.driver_name} ({driverLaps.length})</div>
                            {driverLaps.length > 0 ? (
                              <div className="border border-gray-800/90 rounded-lg overflow-hidden">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-[#11141b] text-[10px] uppercase text-gray-400">
                                    <tr>
                                      <th className="py-1.5 px-3 w-14">Giro</th>
                                      <th className="py-1.5 px-3 text-right">Settore 1</th>
                                      <th className="py-1.5 px-3 text-right">Settore 2</th>
                                      <th className="py-1.5 px-3 text-right">Settore 3</th>
                                      <th className="py-1.5 px-3 text-right">Tempo Giro</th>
                                      <th className="py-1.5 px-3 text-center">Validità</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-800/60">
                                    {driverLaps.map((l: any, idx: number) => (
                                      <tr key={l.id} className="hover:bg-gray-800/20">
                                        <td className="py-1.5 px-3 font-mono text-gray-500">#{idx + 1}</td>
                                        <td className="py-1.5 px-3 text-right font-mono text-gray-400">{formatMs(l.sector_1_ms)}</td>
                                        <td className="py-1.5 px-3 text-right font-mono text-gray-400">{formatMs(l.sector_2_ms)}</td>
                                        <td className="py-1.5 px-3 text-right font-mono text-gray-400">{formatMs(l.sector_3_ms)}</td>
                                        <td className={`py-1.5 px-3 text-right font-mono font-bold ${l.is_valid ? (l.lap_time_ms === r.best_lap_ms ? 'text-emerald-400' : 'text-white') : 'text-red-400 line-through'}`}>{formatMs(l.lap_time_ms)}</td>
                                        <td className="py-1.5 px-3 text-center">{l.is_valid ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" /> : <AlertCircle className="w-3.5 h-3.5 text-red-500 inline" />}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500 py-2">Nessun dettaglio giro disponibile per questo pilota.</p>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
