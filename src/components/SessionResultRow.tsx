'use client';
import React from 'react';
import { ChevronRight, ChevronDown, AlertTriangle } from 'lucide-react';
import { NationFlag, formatMs } from '@/lib/evoUtils';
import { useLanguage } from '@/context/LanguageContext';
import { DriverLapsSubtable } from './DriverLapsSubtable';

interface SessionResultRowProps {
  r: any;
  isRace: boolean;
  isQualy: boolean;
  isExpanded: boolean;
  driverLaps: any[];
  onToggle: () => void;
}

export function SessionResultRow({
  r,
  isRace,
  isQualy,
  isExpanded,
  driverLaps,
  onToggle,
}: SessionResultRowProps) {
  const { t } = useLanguage();
  const gridPos = typeof r.grid_position === 'number' && r.grid_position > 0 ? r.grid_position : null;
  const posDelta = isRace && gridPos !== null ? gridPos - r.position : 0;
  const isDsq = Boolean(r.is_disqualified);
  const penaltySec = Number(r.penalty_seconds || 0);

  return (
    <React.Fragment>
      <tr
        onClick={onToggle}
        className={`cursor-pointer transition ${isExpanded ? 'bg-gray-800/60' : 'hover:bg-gray-800/30'}`}
      >
        <td className="py-2.5 px-3 font-mono font-bold whitespace-nowrap">
          <div className="inline-flex items-center gap-1.5">
            {isDsq ? (
              <span
                title={t.sessions.disqualified}
                className="px-2 py-0.5 rounded bg-red-600/25 text-red-400 border border-red-500/50 text-xs font-extrabold uppercase tracking-wider"
              >
                DSQ
              </span>
            ) : isQualy && r.position === 1 ? (
              <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-extrabold uppercase tracking-wide">
                {t.common.polePosition}
              </span>
            ) : (
              <span className="text-amber-400">P{r.position}</span>
            )}

            {!isDsq && isRace && gridPos !== null && posDelta > 0 && (
              <span
                title={t.sessions.gridTooltipGain
                  .replace('{grid}', String(gridPos))
                  .replace('{pos}', String(r.position))
                  .replace('{delta}', String(posDelta))}
                className="inline-flex items-center gap-0.5 text-emerald-400 cursor-help select-none"
              >
                <span className="text-[11px] leading-none">▲</span>
                <span className="text-[10px] font-bold">+{posDelta}</span>
              </span>
            )}
            {!isDsq && isRace && gridPos !== null && posDelta < 0 && (
              <span
                title={t.sessions.gridTooltipLoss
                  .replace('{grid}', String(gridPos))
                  .replace('{pos}', String(r.position))
                  .replace('{delta}', String(posDelta))}
                className="inline-flex items-center gap-0.5 text-red-500 cursor-help select-none"
              >
                <span className="text-[11px] leading-none">▼</span>
                <span className="text-[10px] font-bold">{posDelta}</span>
              </span>
            )}
          </div>
        </td>

        <td className="py-2.5 px-3 font-semibold text-white">
          <div className="flex items-center gap-1.5 flex-wrap">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
            )}
            <span className={isDsq ? 'text-gray-400 line-through' : ''}>{r.driver_name}</span>
            <NationFlag nation={r.nation} />
            {penaltySec > 0 && (
              <span
                title={t.sessions.penaltyTooltip.replace('{sec}', String(penaltySec))}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-400 font-mono text-[11px] font-bold"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                +{penaltySec}s
              </span>
            )}
          </div>
        </td>

        <td className="py-2.5 px-3 text-xs text-gray-300">{r.car_model}</td>
        <td className="py-2.5 px-3 text-center font-mono text-gray-300">{r.laps_completed}</td>
        <td className="py-2.5 px-3 text-right font-mono text-emerald-400">{formatMs(r.best_lap_ms)}</td>
        <td className="py-2.5 px-3 text-right font-mono text-gray-400">
          {isDsq ? <span className="text-red-400 font-bold">DSQ</span> : formatMs(r.total_time_ms)}
        </td>
      </tr>

      {isExpanded && (
        <DriverLapsSubtable driverName={r.driver_name} bestLapMs={r.best_lap_ms} laps={driverLaps} />
      )}
    </React.Fragment>
  );
}
