'use client';
import React from 'react';
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

  const safeMs = Number(ms || 0);
  const formattedDate = recordedAt ? formatLocalDateTime(recordedAt) : '';
  const tooltip = formattedDate
    ? `${lang === 'en' ? 'Recorded on' : 'Registrato il'}: ${formattedDate}`
    : undefined;

  return (
    <span title={tooltip} className={className}>
      {formatMs(safeMs)}
    </span>
  );
}
