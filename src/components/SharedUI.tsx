'use client';
import React from 'react';
export { NationFlag, TrackPreview } from '@/lib/evoUtils';

export function OnlineViewersBadge({ count }: { count?: number }) {
  return (
    <div className="flex items-center gap-3 text-[11px]">
      {typeof count === 'number' && (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {count} {count === 1 ? 'utente online' : 'utenti online'}
        </span>
      )}
      <span className="text-gray-500">Live ogni 30s</span>
    </div>
  );
}
