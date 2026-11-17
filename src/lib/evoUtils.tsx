'use client';
import React, { useEffect, useState } from 'react';
import { Flag } from 'lucide-react';

export const ISO3_TO_ISO2: Record<string, string> = {
  AFG:'af',ALB:'al',DZA:'dz',AND:'ad',AGO:'ao',ARG:'ar',ARM:'am',AUS:'au',AUT:'at',AZE:'az',BHS:'bs',BHR:'bh',BGD:'bd',BRB:'bb',BLR:'by',BEL:'be',
  BLZ:'bz',BEN:'bj',BTN:'bt',BOL:'bo',BIH:'ba',BWA:'bw',BRA:'br',BRN:'bn',BGR:'bg',BFA:'bf',BDI:'bi',KHM:'kh',CMR:'cm',CAN:'ca',CPV:'cv',CAF:'cf',
  TCD:'td',CHL:'cl',CHN:'cn',COL:'co',COM:'km',COG:'cg',COD:'cd',CRI:'cr',CIV:'ci',HRV:'hr',CUB:'cu',CYP:'cy',CZE:'cz',DNK:'dk',DJI:'dj',DMA:'dm',
  DOM:'do',ECU:'ec',EGY:'eg',SLV:'sv',GNQ:'gq',ERI:'er',EST:'ee',SWZ:'sz',ETH:'et',FJI:'fj',FIN:'fi',FRA:'fr',GAB:'ga',GMB:'gm',GEO:'ge',DEU:'de',
  GER:'de',GHA:'gh',GRC:'gr',GRE:'gr',GRD:'gd',GTM:'gt',GIN:'gn',GNB:'gw',GUY:'gy',HTI:'ht',HND:'hn',HUN:'hu',ISL:'is',IND:'in',IDN:'id',IRN:'ir',
  IRQ:'iq',IRL:'ie',ISR:'il',ITA:'it',JAM:'jm',JPN:'jp',JOR:'jo',KAZ:'kz',KEN:'ke',KIR:'ki',PRK:'kp',KOR:'kr',KWT:'kw',KGZ:'kg',LAO:'la',LVA:'lv',
  LBN:'lb',LSO:'ls',LBR:'lr',LBY:'ly',LIE:'li',LTU:'lt',LUX:'lu',MDG:'mg',MWI:'mw',MYS:'my',MDV:'mv',MLI:'ml',MLT:'mt',MHL:'mh',MRT:'mr',MUS:'mu',
  MEX:'mx',FSM:'fm',MDA:'md',MCO:'mc',MNG:'mn',MNE:'me',MAR:'ma',MOZ:'mz',MMR:'mm',NAM:'na',NRU:'nr',NPL:'np',NLD:'nl',NED:'nl',NZL:'nz',NIC:'ni',
  NER:'ne',NGA:'ng',MKD:'mk',NOR:'no',OMN:'om',PAK:'pk',PLW:'pw',PAN:'pa',PNG:'pg',PRY:'py',PER:'pe',PHL:'ph',POL:'pl',PRT:'pt',POR:'pt',QAT:'qa',
  ROU:'ro',ROM:'ro',RUS:'ru',RWA:'rw',KNA:'kn',LCA:'lc',VCT:'vc',WSM:'ws',SMR:'sm',STP:'st',SAU:'sa',SEN:'sn',SRB:'rs',SYC:'sc',SLE:'sl',SGP:'sg',
  SVK:'sk',SVN:'si',SLO:'si',SLB:'sb',SOM:'so',ZAF:'za',RSA:'za',SSD:'ss',ESP:'es',SPA:'es',LKA:'lk',SDN:'sd',SUR:'sr',SWE:'se',CHE:'ch',SUI:'ch',
  SYR:'sy',TWN:'tw',TJK:'tj',TZA:'tz',THA:'th',TLS:'tl',TGO:'tg',TON:'to',TTO:'tt',TUN:'tn',TUR:'tr',TKM:'tm',TUV:'tv',UGA:'ug',UKR:'ua',ARE:'ae',
  UAE:'ae',GBR:'gb',UK:'gb',USA:'us',URY:'uy',URU:'uy',UZB:'uz',VUT:'vu',VEN:'ve',VNM:'vn',YEM:'ye',ZMB:'zm',ZWE:'zw',SCO:'gb',ENG:'gb',WAL:'gb'
};

export function setCookie(name: string, value: string, days = 30) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${new Date(Date.now() + days * 864e5).toUTCString()}; path=/; SameSite=Lax`;
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

export function NationFlag({ nation }: { nation?: string }) {
  const [err, setErr] = useState(false);
  if (!nation) return null;
  const clean = nation.trim().toUpperCase();
  const iso2 = clean.length === 2 ? clean.toLowerCase() : ISO3_TO_ISO2[clean] || clean.toLowerCase();
  if (err || !iso2) {
    return <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 font-mono uppercase">{clean}</span>;
  }
  return (
    <img
      src={`/assets/flags/${iso2}.png`}
      alt={clean}
      title={clean}
      onError={() => setErr(true)}
      className="inline-block ml-2 w-5 h-3.5 object-cover rounded-[2px] border border-gray-700/80 shadow-sm align-middle"
    />
  );
}

export function TrackPreview({ trackName, className = 'w-16 h-10' }: { trackName?: string; className?: string }) {
  const [err, setErr] = useState(false);
  useEffect(() => { setErr(false); }, [trackName]);
  const slug = (trackName || '').split('(')[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  if (!slug || err) {
    return (
      <div className={`${className} rounded bg-[#0b0d11] border border-gray-800 flex flex-col items-center justify-center text-gray-600 shrink-0`} title={trackName || 'Layout non disponibile'}>
        <Flag className="w-3.5 h-3.5 opacity-50" />
        <span className="text-[8px] uppercase tracking-tighter mt-0.5">Track</span>
      </div>
    );
  }
  return (
    <div className={`${className} rounded bg-[#0b0d11] border border-gray-800/90 overflow-hidden shrink-0 flex items-center justify-center p-1`}>
      <img src={`/assets/tracks/${slug}.png`} alt={trackName || 'Circuito'} onError={() => setErr(true)} className="w-full h-full object-contain" />
    </div>
  );
}

export function formatMs(ms: number): string {
  if (!ms || ms <= 0) return '--:--.---';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const ml = ms % 1000;
  return `${m}:${s.toString().padStart(2, '0')}.${ml.toString().padStart(3, '0')}`;
}

export function formatGap(ms: number, bestMs: number): string {
  if (!ms || !bestMs || ms <= bestMs) return '-';
  return `+${((ms - bestMs) / 1000).toFixed(3)}s`;
}

export function normalizeSessionCategory(t?: string): string {
  const st = (t || '').trim().toLowerCase();
  if (st.includes('race') || st.includes('gara')) return 'Race';
  if (st.includes('qualif')) return 'Qualifying';
  if (st.includes('warm')) return 'Warmup';
  if (st.includes('pract') || st.includes('pratic') || st.includes('fp')) return 'Practice';
  return t || 'Other';
}

export function getSessionTypeLabel(c: string): string {
  if (c === 'Race') return 'Gara (Race)';
  if (c === 'Qualifying') return 'Qualifiche';
  if (c === 'Practice') return 'Pratica (Practice)';
  if (c === 'Warmup') return 'Warmup';
  return c;
}

export function formatLocalDateTime(utcStr?: string | null): string {
  if (!utcStr) return '';
  const m = String(utcStr).trim().match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})/);
  if (!m) return String(utcStr);
  const d = new Date(`${m[1]}T${m[2]}Z`);
  if (Number.isNaN(d.getTime())) return String(utcStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
