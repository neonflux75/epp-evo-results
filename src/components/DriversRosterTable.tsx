'use client';
import React, { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, X } from 'lucide-react';
import { NationFlag } from '@/lib/evoUtils';
import { useLanguage } from '@/context/LanguageContext';

type SortKey = 'name' | 'wins' | 'clean';
type SortDir = 'asc' | 'desc';

export function DriversRosterSection({
  drivers,
  onOpenDriver,
}: {
  drivers: any[];
  onOpenDriver: (guid: string, name?: string, nation?: string) => void;
}) {
  const { t, lang } = useLanguage();
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const uniqueDrivers = useMemo(() => {
    const map = new Map<string, any>();
    (drivers || []).forEach((d: any, idx: number) => {
      const rawGuid = String(d.driver_guid || '').trim();
      const rawName = String(d.driver_name || '').trim();
      const key = rawGuid || `${rawName.toLowerCase()}_${idx}`;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          ...d,
          _uid: key,
          driver_name: rawName,
          total_laps: Number(d.total_laps || 0),
          valid_laps: Number(d.valid_laps || 0),
          wins: Number(d.wins || 0),
        });
      } else {
        existing.total_laps += Number(d.total_laps || 0);
        existing.valid_laps += Number(d.valid_laps || 0);
        existing.wins = Math.max(existing.wins, Number(d.wins || 0));
        if (rawName.length > existing.driver_name.length) existing.driver_name = rawName;
        if (!existing.nation && d.nation) existing.nation = d.nation;
      }
    });

    return Array.from(map.values()).map((d) => {
      const total = Number(d.total_laps || 0);
      const valid = Number(d.valid_laps || 0);
      const ratio = total > 0 ? valid / total : 0;
      return { ...d, _total: total, _valid: valid, _ratio: ratio, _pct: Math.round(ratio * 100) };
    });
  }, [drivers]);

  const sortedDrivers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = q
      ? uniqueDrivers.filter((d) => d.driver_name.toLowerCase().includes(q))
      : [...uniqueDrivers];

    const dir = sortDir === 'asc' ? 1 : -1;
    filtered.sort((a, b) => {
      const nameCmp = a.driver_name.localeCompare(b.driver_name, 'it', { sensitivity: 'base' });
      if (sortKey === 'name') return dir * nameCmp;
      if (sortKey === 'wins') {
        const diff = a.wins - b.wins;
        return diff !== 0 ? dir * diff : nameCmp;
      }
      const ratioDiff = a._ratio - b._ratio;
      if (Math.abs(ratioDiff) > 0.0001) return dir * ratioDiff;
      const validDiff = a._valid - b._valid;
      return validDiff !== 0 ? dir * validDiff : nameCmp;
    });
    return filtered;
  }, [uniqueDrivers, sortKey, sortDir, searchQuery]);

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="w-3 h-3 text-gray-600 inline ml-1" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-red-400 inline ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-red-400 inline ml-1" />
    );
  };

  return (
    <section translate="no" className="notranslate bg-[#131720] border border-gray-800/90 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-base font-bold text-white">{t.driversRoster.title}</h2>
        <p className="text-xs text-gray-400">{t.driversRoster.subtitle}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0e1118] text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-800 select-none">
              <th className="py-2.5 px-4">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleSort('name')}
                    className="inline-flex items-center cursor-pointer hover:text-white transition uppercase font-bold"
                  >
                    <span>{t.common.driver}</span>
                    {renderSortIcon('name')}
                  </button>
                  <div onClick={(e) => e.stopPropagation()} className="relative flex items-center w-32 sm:w-44">
                    <Search className="w-3 h-3 text-gray-500 absolute left-2 pointer-events-none" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={lang === 'en' ? 'Search...' : 'Cerca...'}
                      className="w-full bg-[#131720] border border-gray-700/80 rounded-md pl-6 pr-6 py-1 text-[11px] font-normal normal-case tracking-normal text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-1.5 text-gray-400 hover:text-white cursor-pointer"
                        aria-label="Clear search"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </th>
              <th onClick={() => handleSort('wins')} className="py-2.5 px-3 text-center cursor-pointer hover:text-white transition">
                <span>{t.driversRoster.raceWins}</span>
                {renderSortIcon('wins')}
              </th>
              <th onClick={() => handleSort('clean')} className="py-2.5 px-4 text-right w-40 sm:w-44 cursor-pointer hover:text-white transition">
                <span>Clean</span>
                {renderSortIcon('clean')}
              </th>
            </tr>
          </thead>
          <tbody key={`${sortKey}-${sortDir}-${searchQuery}`} className="divide-y divide-gray-800/60 text-sm">
            {sortedDrivers.map((d: any) => {
              const pct = d._pct;
              const pillStyle =
                pct >= 85
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                  : pct >= 65
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  : 'bg-red-500/15 text-red-400 border-red-500/40';

              return (
                <tr key={d._uid} className="hover:bg-gray-800/30">
                  <td className="py-3 px-4 font-semibold text-white">
                    <button
                      type="button"
                      onClick={() => onOpenDriver(d.driver_guid, d.driver_name, d.nation)}
                      className="hover:text-red-400 hover:underline transition text-left cursor-pointer"
                    >
                      <span>{d.driver_name}</span>
                    </button>
                    <NationFlag nation={d.nation} />
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-amber-400">
                    <span>{d.wins}</span>
                  </td>
                  <td className="py-3 px-4 text-right" title={`${t.driversRoster.validLaps}: ${d._valid} / ${d._total}`}>
                    <div className="inline-flex items-center justify-end gap-2">
                      <div className="w-16 sm:w-20 h-1.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700/70">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            background: 'linear-gradient(90deg, #ef4444 0%, #eab308 50%, #10b981 100%)',
                          }}
                        />
                      </div>
                      <span className={`px-2 py-0.5 rounded-full border font-mono text-[10px] font-extrabold leading-none ${pillStyle}`}>
                        {pct}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
            {sortedDrivers.length === 0 && (
              <tr>
                <td colSpan={3} className="py-8 text-center text-xs text-gray-500">
                  {lang === 'en' ? 'No drivers found' : 'Nessun pilota trovato'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
