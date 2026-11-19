'use client';
import React, { useState } from 'react';
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
  const [hovered, setHovered] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const imgUrl = resolveCarImage(carName);

  if (!carName) return null;
  const hasValidImg = Boolean(imgUrl && !imgFailed);

  return (
    <span
      className={`relative inline-flex items-center gap-1.5 group ${
        hasValidImg ? 'cursor-pointer' : ''
      } ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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

      {hovered && hasValidImg && imgUrl && (
        <span className="pointer-events-none absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-64 rounded-xl bg-[#0b0e14]/95 border border-red-500/50 p-3 shadow-[0_10px_35px_rgba(0,0,0,0.85)] backdrop-blur-md flex flex-col items-center">
          <span className="w-full h-28 flex items-center justify-center overflow-hidden">
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
          </span>
          <span className="mt-2 pt-1.5 border-t border-gray-800/90 w-full text-center text-[11px] font-bold text-gray-100 truncate">
            {carName}
          </span>
        </span>
      )}
    </span>
  );
}
