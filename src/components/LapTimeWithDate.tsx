'use client';
import React, { useState } from 'react';
import { formatMs, formatLocalDateTime } from '@/lib/evoUtils';
import { useLanguage } from '@/context/LanguageContext';

interface LapTimeWithDateProps {
  ms?: number | null;
  recordedAt?: string | null;
  className?: string;
}

export function LapTimeWithDate({
  ms,
  recordedAt,
  className = 'font-mono font-bold text-emerald-400',
}: LapTimeWithDateProps) {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);

  const formattedDate = recordedAt ? formatLocalDateTime(recordedAt) : '';
  const tooltip = formattedDate
    ? `${lang === 'en' ? 'Recorded on' : 'Registrato il'}: ${formattedDate}`
    : undefined;

  if (!formattedDate) {
    return <span className={className}>{formatMs(ms)}</span>;
  }

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        title={tooltip}
        className={`${className} cursor-pointer border-b border-dotted border-emerald-500/40 hover:opacity-90 transition`}
      >
        {formatMs(ms)}
      </button>
      {open && (
        <span className="mt-1 px-2 py-0.5 rounded bg-[#0b0d11] border border-gray-700 text-[10px] font-sans font-normal text-gray-300 whitespace-nowrap shadow z-10">
          {formattedDate}
        </span>
      )}
    </span>
  );
}
