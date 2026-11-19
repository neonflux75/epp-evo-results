'use client';
import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Car } from 'lucide-react';
import carsMap from '@/config/carsMap.json';

function normalizeStr(s: string): string {
  return s
    .toLowerCase()
    .replace(/^ks_/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const CAR_ENTRIES = Object.entries(carsMap as Record<string, string>).map(([id, url]) => ({
  id,
  url,
  norm: normalizeStr(id),
  tokens: normalizeStr(id).split(' ').filter(Boolean),
}));

export function resolveCarImage(carName?: string): string | null {
  if (!carName) return null;
  const rawLower = carName.toLowerCase().trim();
  if (!rawLower || rawLower === 'in pista' || rawLower === 'unknown') return null;

  const map = carsMap as Record<string, string>;
  if (map[rawLower]) return map[rawLower];
  if (map[`ks_${rawLower}`]) return map[`ks_${rawLower}`];

  const qNorm = normalizeStr(carName);
  if (!qNorm) return null;

  const exact = CAR_ENTRIES.find((c) => c.norm === qNorm);
  if (exact) return exact.url;

  const qTokens = qNorm.split(' ').filter(Boolean);
  let bestUrl: string | null = null;
  let bestScore = 0;

  for (const entry of CAR_ENTRIES) {
    let matches = 0;
    for (const qt of qTokens) {
      if (entry.tokens.includes(qt)) {
        matches += qt.length >= 3 ? 2 : 1;
      }
    }
    const coverage = matches / Math.max(qTokens.length, entry.tokens.length);
    if (matches >= 2 && coverage > bestScore) {
      bestScore = coverage;
      bestUrl = entry.url;
    }
  }

  return bestScore >= 0.45 ? bestUrl : null;
}

export function CarHoverPreview({
  carName,
  showIcon = true,
  className = '',
}: {
  carName?: string;
  showIcon?: boolean;
  className?: string;
}) {
  const [coords, setCoords] = useState<{ x: number; y: number; openBelow: boolean } | null>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const imgUrl = resolveCarImage(carName);

  if (!carName) return null;
  const hasValidImg = Boolean(imgUrl && !imgFailed);

  const handleMouseEnter = () => {
    if (!hasValidImg || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const openBelow = rect.top < 185;
    setCoords({
      x: rect.left + rect.width / 2,
      y: openBelow ? rect.bottom + 10 : rect.top - 10,
      openBelow,
    });
  };

  const handleMouseLeave = () => {
    setCoords(null);
  };

  return (
    <>
      <span
        ref={triggerRef}
        className={`inline-flex items-center gap-1.5 group ${
          hasValidImg ? 'cursor-pointer' : ''
        } ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {showIcon && <Car className="w-3.5 h-3.5 text-red-400 shrink-0" />}
        <span
          className={
            hasValidImg
              ? 'underline decoration-dotted decoration-gray-600 underline-offset-4 group-hover:text-white group-hover:decoration-red-400 transition-colors'
              : ''
          }
        >
          {carName}
        </span>
      </span>

      {coords &&
        hasValidImg &&
        imgUrl &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              left: `${Math.min(Math.max(coords.x, 140), window.innerWidth - 140)}px`,
              top: `${coords.y}px`,
              transform: coords.openBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
              zIndex: 99999,
            }}
            className="pointer-events-none w-64 rounded-xl bg-[#0b0e14]/95 border border-red-500/50 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.9)] backdrop-blur-md flex flex-col items-center"
          >
            <div className="w-full h-28 flex items-center justify-center overflow-hidden rounded-lg bg-white/[0.03]">
              <img
                src={imgUrl}
                alt={carName}
                onError={() => setImgFailed(true)}
                className="max-h-full max-w-full w-auto h-auto object-contain"
                style={{
                  filter:
                    'drop-shadow(0 4px 12px rgba(239, 68, 68, 0.45)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.9))',
                }}
              />
            </div>
            <div className="mt-2 pt-1.5 border-t border-gray-800/90 w-full text-center text-[11px] font-bold text-gray-100 truncate">
              {carName}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
