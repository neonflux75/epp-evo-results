'use client';
import React, { useEffect, useState, useRef } from 'react';
import { Trophy, Flag, Users, Timer, Server, Activity, ChevronRight, ChevronDown, X, CheckCircle2, AlertCircle, Car, MessageSquare, Send, Bot } from 'lucide-react';

const ISO3_TO_ISO2: Record<string, string> = {
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

function setCookie(name: string, value: string, days = 30) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${new Date(Date.now() + days * 864e5).toUTCString()}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

function NationFlag({ nation }: { nation?: string }) {
  const [err, setErr] = useState(false);
  if (!nation) return null;
  const clean = nation.trim().toUpperCase();
  const iso2 = clean.length === 2 ? clean.toLowerCase() : ISO3_TO_ISO2[clean] || clean.toLowerCase();
  if (err || !iso2) return <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 font-mono uppercase">{clean}</span>;
  return <img src={`/assets/flags/${iso2}.png`} alt={clean} title={clean} onError={() => setErr(true)} className="inline-block ml-2 w-5 h-3.5 object-cover rounded-[2px] border border-gray-700/80 shadow-sm align-middle" />;
}

function TrackPreview({ trackName, className = 'w-16 h-10' }: { trackName?: string; className?: string }) {
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

function formatMs(ms: number): string {
  if (!ms || ms <= 0) return '--:--.---';
  const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000), ml = ms % 1000;
  return `${m}:${s.toString().padStart(2, '0')}.${ml.toString().padStart(3, '0')}`;
}

function formatGap(ms: number, bestMs: number): string {
  if (!ms || !bestMs || ms <= bestMs) return '-';
  return `+${((ms - bestMs) / 1000).toFixed(3)}s`;
}

function normalizeSessionCategory(t?: string): string {
  const st = (t || '').trim().toLowerCase();
  if (st.includes('race') || st.includes('gara')) return 'Race';
  if (st.includes('qualif')) return 'Qualifying';
  if (st.includes('warm')) return 'Warmup';
  if (st.includes('pract') || st.includes('pratic') || st.includes('fp')) return 'Practice';
  return t || 'Other';
}

function getSessionTypeLabel(c: string): string {
  if (c === 'Race') return 'Gara (Race)';
  if (c === 'Qualifying') return 'Qualifiche';
  if (c === 'Practice') return 'Pratica (Practice)';
  if (c === 'Warmup') return 'Warmup';
  return c;
}

interface ChatMessage { id: string; sender: 'bot' | 'user'; text: string; }

export default function EvoResultsDashboard() {
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'sessions' | 'records' | 'drivers'>('leaderboard');
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [selectedCar, setSelectedCar] = useState<string>('ALL');
  const [selectedSessionTrack, setSelectedSessionTrack] = useState<string>('ALL');
  const [selectedSessionType, setSelectedSessionType] = useState<string>('ALL');
  const [cookiesLoaded, setCookiesLoaded] = useState(false);

  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [expandedDriverGuid, setExpandedDriverGuid] = useState<string | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [selectedLiveServerId, setSelectedLiveServerId] = useState<string | null>(null);

  const [selectedDriverProfile, setSelectedDriverProfile] = useState<any>(null);
  const [loadingDriverProfile, setLoadingDriverProfile] = useState(false);
  const [driverModalCarFilter, setDriverModalCarFilter] = useState<string>('ALL');

  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 'welcome', sender: 'bot', text: 'Ciao! Sono l\'assistente telemetrico di **EVO RESULTS**. Scrivi il tuo nome (es. *"Mario Rossi"*) per sapere subito la tua posizione in classifica e i tuoi migliori tempi!' }
  ]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const t = getCookie('evo_active_tab');
    if (t === 'leaderboard' || t === 'sessions' || t === 'records' || t === 'drivers') setActiveTab(t);
    const tr = getCookie('evo_top100_track'); if (tr) setSelectedTrack(tr);
    const ca = getCookie('evo_top100_car'); if (ca) setSelectedCar(ca);
    const str = getCookie('evo_session_track'); if (str) setSelectedSessionTrack(str);
    const sty = getCookie('evo_session_type'); if (sty) setSelectedSessionType(sty);
    setCookiesLoaded(true);
  }, []);

  useEffect(() => {
    if (chatOpen && chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatOpen]);

  const sendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed || chatLoading) return;
    setChatMessages(p => [...p, { id: Date.now().toString(), sender: 'user', text: trimmed }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: trimmed }) });
      const json = await res.json();
      setChatMessages(p => [...p, { id: (Date.now() + 1).toString(), sender: 'bot', text: json.reply || 'Nessuna risposta.' }]);
    } catch {
      setChatMessages(p => [...p, { id: (Date.now() + 1).toString(), sender: 'bot', text: 'Errore di connessione con il server.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const fetchDashboard = async (track = selectedTrack) => {
    try {
      const res = await fetch(`/api/dashboard${track ? `?track=${encodeURIComponent(track)}` : ''}`);
      const json = await res.json();
      if (json.tracks?.length > 0) {
        const exists = json.tracks.some((t: any) => t.track_name === track);
        if (!track || !exists) {
          const rnd = json.tracks[Math.floor(Math.random() * json.tracks.length)].track_name;
          setSelectedTrack(rnd);
          setCookie('evo_top100_track', rnd);
          const r2 = await fetch(`/api/dashboard?track=${encodeURIComponent(rnd)}`);
          setData(await r2.json());
          return;
        }
      }
      setData(json);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!cookiesLoaded) return;
    fetchDashboard(selectedTrack);
    const iv = setInterval(() => fetchDashboard(selectedTrack), 30000);
    return () => clearInterval(iv);
  }, [selectedTrack, cookiesLoaded]);

  const handleTabChange = (tab: 'leaderboard' | 'sessions' | 'records' | 'drivers') => { setActiveTab(tab); setCookie('evo_active_tab', tab); };
  const handleTrackChange = (v: string) => { setSelectedTrack(v); setCookie('evo_top100_track', v); setSelectedCar('ALL'); setCookie('evo_top100_car', 'ALL'); };
  const handleCarChange = (v: string) => { setSelectedCar(v); setCookie('evo_top100_car', v); };
  const handleSessionTrackChange = (v: string) => { setSelectedSessionTrack(v); setCookie('evo_session_track', v); };
  const handleSessionTypeChange = (v: string) => { setSelectedSessionType(v); setCookie('evo_session_type', v); };

  const openSessionDetails = async (id: number) => {
    setLoadingSession(true);
    setExpandedDriverGuid(null);
    try {
      const res = await fetch(`/api/dashboard?sessionId=${id}`);
      setSelectedSession(await res.json());
    } catch {}
    setLoadingSession(false);
  };

  const openDriverProfile = async (guid: string, name?: string, nation?: string) => {
    if (!guid) return;
    setLoadingDriverProfile(true);
    setDriverModalCarFilter('ALL');
    setSelectedDriverProfile({ driver: { driver_guid: guid, driver_name: name || 'Pilota', nation: nation || '' }, laps: [] });
    try {
      const res = await fetch(`/api/dashboard?driverGuid=${encodeURIComponent(guid)}`);
      const json = await res.json();
      if (json?.driver) setSelectedDriverProfile(json);
    } catch {}
    setLoadingDriverProfile(false);
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0b0d11] text-gray-200 flex items-center justify-center">
        <div className="flex items-center gap-3 text-red-500 font-semibold tracking-wider">
          <Activity className="animate-spin" /> CARICAMENTO EVO RESULTS...
        </div>
      </div>
    );
  }

  const availableCars = Array.from(new Set((data.leaderboard || []).map((r: any) => r.car_model).filter(Boolean))).sort() as string[];
  const effectiveSelectedCar = selectedCar === 'ALL' || availableCars.includes(selectedCar) ? selectedCar : 'ALL';
  const filteredLeaderboard = (data.leaderboard || []).filter((r: any) => effectiveSelectedCar === 'ALL' ? true : r.car_model === effectiveSelectedCar);
  const bestLeaderboardTime = filteredLeaderboard.length > 0 ? filteredLeaderboard[0].best_lap_ms : 0;

  const sessionTracks = Array.from(new Set([...(data.tracks || []).map((t: any) => t.track_name), ...(data.sessions || []).map((s: any) => s.track_name)].filter(Boolean))).sort() as string[];
  const filteredSessions = (data.sessions || []).filter((s: any) =>
    (selectedSessionTrack === 'ALL' || s.track_name === selectedSessionTrack) &&
    (selectedSessionType === 'ALL' || normalizeSessionCategory(s.session_type) === selectedSessionType)
  );

  const activeServerModal = data.liveServers.find((s: any) => s.id === selectedLiveServerId) || null;
  const driverRecords = selectedDriverProfile?.records || selectedDriverProfile?.laps || [];
  const driverModalCars = Array.from(new Set(driverRecords.map((r: any) => r.car_model).filter(Boolean))).sort() as string[];
  const filteredDriverRecords = driverRecords.filter((r: any) => driverModalCarFilter === 'ALL' ? true : r.car_model === driverModalCarFilter);

  const renderFormattedText = (text: string) => text.split('\n').map((line, i) => (
    <div key={i} className={i > 0 ? 'mt-1' : ''}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith('**') && part.endsWith('**') ? <strong key={j} className="text-white font-bold">{part.slice(2, -2)}</strong> : <span key={j}>{part}</span>
      )}
    </div>
  ));

  return (
    <div className="min-h-screen bg-[#0b0d11] text-gray-100 font-sans selection:bg-red-600 selection:text-white">
      <div className="relative w-full h-24 sm:h-28 overflow-hidden border-b border-red-900/50 bg-[#0b0d11]">
        <img src="/assets/banner-epp.png" alt="=EPP= Racing Team" className="w-full h-full object-cover object-center opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0d11]/85 via-[#0b0d11]/35 to-[#0b0d11]/85" />
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <h2
            style={{ fontFamily: 'var(--font-orbitron), sans-serif' }}
            className="text-2xl sm:text-4xl md:text-5xl font-black italic tracking-[0.14em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-red-500 drop-shadow-[0_0_22px_rgba(239,68,68,0.85)] select-none text-center"
          >
            =EPP= <span className="text-red-500">Racing</span> Team
          </h2>
        </div>
      </div>

      <header className="border-b border-gray-800/80 bg-[#11141b]/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center font-black text-white tracking-tighter shadow-lg shadow-red-900/30">EVO</div>
            <div>
              <h1 className="text-lg font-extrabold tracking-wider text-white flex items-center gap-2">EVO <span className="text-red-500">RESULTS</span></h1>
              <p className="text-[11px] text-gray-400 uppercase tracking-widest">Assetto Corsa EVO Telemetry & Standings</p>
            </div>
          </div>
          <nav className="flex items-center gap-1 sm:gap-2">
            {[
              { id: 'leaderboard', label: 'Top 100 Tempi', Icon: Timer },
              { id: 'sessions', label: 'Gare & Sessioni', Icon: Flag },
              { id: 'records', label: 'Record Piste', Icon: Trophy },
              { id: 'drivers', label: 'Piloti', Icon: Users }
            ].map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id as any)}
                className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition ${activeTab === id ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800/60'}`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </nav>
        </div>
      </header>
	        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Server className="w-4 h-4 text-red-500" /> Stato Live Server ({data.liveServers.length}) — <span className="text-gray-500 normal-case font-normal">Clicca su un server per vedere i piloti connessi</span>
            </h2>
            <span className="text-[11px] text-gray-500">Live ogni 30s</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.liveServers.map((srv: any) => {
              const count = Math.max(srv.players || 0, srv.playersList?.length || 0);
              return (
                <div key={srv.id} onClick={() => setSelectedLiveServerId(srv.id)} className="bg-[#131720] border border-gray-800/90 rounded-lg p-4 flex flex-col justify-between hover:border-red-500/60 hover:bg-[#171c28] cursor-pointer transition group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <TrackPreview trackName={srv.track} className="w-16 h-11" />
                      <div className="min-w-0">
                        {srv.online && srv.sessionPhase && (
                          <span className={`inline-block mb-1 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${srv.sessionPhase === 'GARA' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : srv.sessionPhase === 'QUALIFICHE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-sky-500/20 text-sky-400 border border-sky-500/40'}`}>
                            {srv.sessionPhase}
                          </span>
                        )}
                        <h3 className="text-sm font-bold text-white leading-tight line-clamp-1 group-hover:text-red-400 transition">{srv.name}</h3>
                        <p className="text-xs text-gray-400 truncate mt-0.5">{srv.track || 'Circuito N/D'}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${srv.online ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${srv.online ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
                      {srv.online ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Clicca per lista piloti</span>
                    <span className={`font-mono font-bold px-2 py-0.5 rounded ${count > 0 ? 'bg-amber-500/15 text-amber-400' : 'bg-gray-800/80 text-gray-400'}`}>Piloti: {count}/{srv.maxPlayers}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {activeTab === 'leaderboard' && (
          <section className="bg-[#131720] border border-gray-800/90 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">Classifica Top 100 Migliori Tempi</h2>
                <p className="text-xs text-gray-400">Clicca su un pilota per vedere tutti i suoi giri veloci sui vari tracciati</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400">Circuito:</label>
                  <select value={selectedTrack} onChange={(e) => handleTrackChange(e.target.value)} className="bg-[#0b0d11] border border-gray-700 text-sm text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-500">
                    {data.tracks.map((t: any) => <option key={t.track_name} value={t.track_name}>{t.track_name}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400">Auto:</label>
                  <select value={effectiveSelectedCar} onChange={(e) => handleCarChange(e.target.value)} className="bg-[#0b0d11] border border-gray-700 text-sm text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-500 max-w-[230px]">
                    <option value="ALL">Tutte le auto</option>
                    {availableCars.map((c: string) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0e1118] text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-800">
                    <th className="py-3 px-4 w-12">Pos</th>
                    <th className="py-3 px-4">Pilota</th>
                    <th className="py-3 px-4">Vettura</th>
                    <th className="py-3 px-4">Circuito</th>
                    <th className="py-3 px-4 text-right">Settore 1</th>
                    <th className="py-3 px-4 text-right">Settore 2</th>
                    <th className="py-3 px-4 text-right">Settore 3</th>
                    <th className="py-3 px-4 text-right">Miglior Giro</th>
                    <th className="py-3 px-4 text-right">Distacco</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 text-sm">
                  {filteredLeaderboard.map((row: any, i: number) => (
                    <tr key={`${row.driver_guid}-${row.car_model}-${row.track_name}`} className="hover:bg-gray-800/30 transition">
                      <td className="py-3 px-4 font-mono font-bold">
                        {i === 0 ? <span className="text-amber-400">#1</span> : i === 1 ? <span className="text-gray-300">#2</span> : i === 2 ? <span className="text-amber-600">#3</span> : <span className="text-gray-500">#{i + 1}</span>}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        <button type="button" onClick={() => openDriverProfile(row.driver_guid, row.driver_name, row.nation)} className="hover:text-red-400 hover:underline transition text-left cursor-pointer" title="Vedi tutti i giri veloci di questo pilota">
                          {row.driver_name}
                        </button>
                        <NationFlag nation={row.nation} />
                      </td>
                      <td className="py-3 px-4 text-gray-300 text-xs">{row.car_model}</td>
                      <td className="py-3 px-4 text-gray-400 text-xs">{row.track_name}</td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-gray-400">{formatMs(row.sector_1_ms)}</td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-gray-400">{formatMs(row.sector_2_ms)}</td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-gray-400">{formatMs(row.sector_3_ms)}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">{formatMs(row.best_lap_ms)}</td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-gray-400">{formatGap(row.best_lap_ms, bestLeaderboardTime)}</td>
                    </tr>
                  ))}
                  {filteredLeaderboard.length === 0 && (
                    <tr><td colSpan={9} className="py-8 text-center text-gray-500">Nessun giro valido registrato per questa selezione.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'sessions' && (
          <section className="bg-[#131720] border border-gray-800/90 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white">Ultime Gare e Sessioni Disputate</h2>
                <p className="text-xs text-gray-400">Clicca su una sessione per aprire l&apos;ordine d&apos;arrivo e ispezionare i giri di ciascun pilota</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400">Circuito:</label>
                  <select value={selectedSessionTrack} onChange={(e) => handleSessionTrackChange(e.target.value)} className="bg-[#0b0d11] border border-gray-700 text-sm text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-500">
                    <option value="ALL">Tutti i tracciati</option>
                    {sessionTracks.map((tr: string) => <option key={tr} value={tr}>{tr}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-1 bg-[#0b0d11] p-1 rounded-lg border border-gray-800">
                  {[{ id: 'ALL', label: 'Tutte' }, { id: 'Race', label: 'Gare' }, { id: 'Qualifying', label: 'Qualifiche' }, { id: 'Practice', label: 'Pratica' }, { id: 'Warmup', label: 'Warmup' }].map((item) => (
                    <button key={item.id} onClick={() => handleSessionTypeChange(item.id)} className={`px-2.5 py-1 rounded-md text-xs font-semibold transition ${selectedSessionType === item.id ? 'bg-red-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-800/60'}`}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-800/70">
              {filteredSessions.map((s: any) => {
                const cat = normalizeSessionCategory(s.session_type);
                const isQualy = cat === 'Qualifying';
                return (
                  <div key={s.id} onClick={() => openSessionDetails(s.id)} className="p-4 hover:bg-gray-800/40 cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <TrackPreview trackName={s.track_name} className="w-14 h-9" />
                      <span className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider shrink-0 ${cat === 'Race' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : isQualy ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : cat === 'Warmup' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                        {s.session_type}
                      </span>
                      <div>
                        <h3 className="font-bold text-white text-sm">{s.track_name} <span className="text-gray-500 font-normal">({s.server_name})</span></h3>
                        <p className="text-xs text-gray-400">Data: {s.played_at} • Piloti partecipanti: <strong className="text-gray-200">{s.driver_count}</strong></p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      {s.winner_name && (
                        <div className="text-right">
                          <span className={`text-[10px] uppercase block font-bold tracking-wider ${isQualy ? 'text-purple-400' : 'text-gray-500'}`}>
                            {isQualy ? 'Pole Position' : '1° Classificato'}
                          </span>
                          <span className="text-xs font-bold text-amber-400 block">{s.winner_name}</span>
                          {s.winner_car && (
                            <span className="text-[11px] text-gray-400 flex items-center justify-end gap-1 mt-0.5">
                              <Car className="w-3 h-3 text-red-400 shrink-0" /> {s.winner_car}
                            </span>
                          )}
                        </div>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    </div>
                  </div>
                );
              })}
              {filteredSessions.length === 0 && (
                <div className="py-10 text-center text-gray-500 text-sm">
                  Nessuna sessione trovata con i filtri selezionati ({selectedSessionTrack !== 'ALL' ? selectedSessionTrack : 'Tutti i tracciati'} • {getSessionTypeLabel(selectedSessionType)}).
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'records' && (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.trackRecords.map((rec: any) => (
              <div key={rec.track_name} className="bg-[#131720] border border-gray-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-red-500">Track Record</span>
                  <Trophy className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-white">{rec.track_name}</h3>
                    <p className="text-xs text-gray-400">{rec.track_layout || 'Layout Standard'}</p>
                  </div>
                  <TrackPreview trackName={rec.track_name} className="w-20 h-12" />
                </div>
                <div className="pt-3 border-t border-gray-800/80 flex items-end justify-between">
                  <div>
                    <p className="text-sm font-bold text-white flex items-center">{rec.driver_name}<NationFlag nation={rec.nation} /></p>
                    <p className="text-xs text-gray-400">{rec.car_model}</p>
                  </div>
                  <span className="text-xl font-mono font-black text-emerald-400">{formatMs(rec.record_ms)}</span>
                </div>
              </div>
            ))}
          </section>
        )}

        {activeTab === 'drivers' && (
          <section className="bg-[#131720] border border-gray-800/90 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <h2 className="text-base font-bold text-white">Albo Piloti</h2>
              <p className="text-xs text-gray-400">Clicca su un pilota per visualizzare i suoi migliori tempi sui circuiti</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0e1118] text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-800">
                    <th className="py-3 px-4">Pilota</th>
                    <th className="py-3 px-4 text-center">Vittorie Gara</th>
                    <th className="py-3 px-4 text-center">Giri Validi</th>
                    <th className="py-3 px-4 text-center">Giri Totali</th>
                    <th className="py-3 px-4 text-right">Miglior Tempo Assoluto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 text-sm">
                  {data.drivers.map((d: any) => (
                    <tr key={d.driver_guid} className="hover:bg-gray-800/30">
                      <td className="py-3 px-4 font-semibold text-white">
                        <button type="button" onClick={() => openDriverProfile(d.driver_guid, d.driver_name, d.nation)} className="hover:text-red-400 hover:underline transition text-left cursor-pointer">
                          {d.driver_name}
                        </button>
                        <NationFlag nation={d.nation} />
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-amber-400">{d.wins || 0}</td>
                      <td className="py-3 px-4 text-center text-emerald-400 font-mono">{d.valid_laps}</td>
                      <td className="py-3 px-4 text-center text-gray-400 font-mono">{d.total_laps}</td>
                      <td className="py-3 px-4 text-right font-mono text-gray-200">{formatMs(d.best_ever_ms)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* MODALE GIRI VELOCI PILOTA */}
      {selectedDriverProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedDriverProfile(null)}>
          <div className="bg-[#131720] border border-gray-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-red-500" />
                  <h3 className="text-lg font-extrabold text-white flex items-center">
                    {selectedDriverProfile.driver?.driver_name}
                    <NationFlag nation={selectedDriverProfile.driver?.nation} />
                  </h3>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">Migliori giri personali su tutti i tracciati e auto con piazzamento in classifica</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400">Filtra Auto:</label>
                  <select value={driverModalCarFilter} onChange={(e) => setDriverModalCarFilter(e.target.value)} className="bg-[#0b0d11] border border-gray-700 text-xs sm:text-sm text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-red-500 max-w-[210px]">
                    <option value="ALL">Tutte le auto ({driverRecords.length})</option>
                    {driverModalCars.map((c: string) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <button onClick={() => setSelectedDriverProfile(null)} className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto">
              {loadingDriverProfile ? (
                <div className="py-12 flex items-center justify-center gap-2 text-red-400 text-sm font-semibold">
                  <Activity className="w-4 h-4 animate-spin" /> Caricamento telemetria pilota...
                </div>
              ) : filteredDriverRecords.length > 0 ? (
                <div className="overflow-x-auto border border-gray-800 rounded-lg">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-[#0e1118] text-[11px] uppercase tracking-wider text-gray-400 border-b border-gray-800">
                      <tr>
                        <th className="py-2.5 px-3">Circuito</th>
                        <th className="py-2.5 px-3">Vettura</th>
                        <th className="py-2.5 px-4 text-center whitespace-nowrap w-px" title="Posizione in classifica generale della pista">Pos. Assoluta</th>
                        <th className="py-2.5 px-4 text-center whitespace-nowrap w-px" title="Posizione nella classifica della stessa auto">Pos. Auto</th>
                        <th className="py-2.5 px-3 text-right whitespace-nowrap">S1 / S2 / S3</th>
                        <th className="py-2.5 px-3 text-right whitespace-nowrap">Miglior Giro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/70">
                      {filteredDriverRecords.map((rec: any, idx: number) => (
                        <tr key={`${rec.track_name}-${rec.car_model}-${idx}`} className="hover:bg-gray-800/30">
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <TrackPreview trackName={rec.track_name} className="w-12 h-8" />
                              <span className="font-semibold text-white text-xs sm:text-sm">{rec.track_name}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-xs text-gray-300">{rec.car_model}</td>
                          <td className="py-2.5 px-4 text-center font-mono whitespace-nowrap w-px">
                            <div className="inline-flex items-center justify-center gap-1">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${rec.overall_rank === 1 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : rec.overall_rank <= 3 ? 'bg-gray-700/60 text-gray-200' : 'bg-gray-800/80 text-gray-300'}`}>
                                #{rec.overall_rank}
                              </span>
                              <span className="text-[11px] text-gray-500">/ {rec.overall_total}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono whitespace-nowrap w-px">
                            <div className="inline-flex items-center justify-center gap-1">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${rec.car_rank === 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800/80 text-gray-300'}`}>
                                #{rec.car_rank}
                              </span>
                              <span className="text-[11px] text-gray-500">/ {rec.car_total}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-[11px] text-gray-400 whitespace-nowrap">
                            {formatMs(rec.sector_1_ms)} • {formatMs(rec.sector_2_ms)} • {formatMs(rec.sector_3_ms)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">{formatMs(rec.best_lap_ms)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-10 text-center text-gray-500 text-sm">Nessun giro valido registrato per questo pilota con il filtro selezionato.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALE SERVER LIVE CON BANDIERINA PILOTA */}
      {activeServerModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedLiveServerId(null)}>
          <div className="bg-[#131720] border border-gray-700 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <TrackPreview trackName={activeServerModal.track} className="w-16 h-11" />
                <div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${activeServerModal.online ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400'}`}>
                    {activeServerModal.online ? activeServerModal.sessionPhase : 'OFFLINE'}
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">{activeServerModal.name}</h3>
                  <p className="text-xs text-gray-400">
                    Circuito: <strong className="text-gray-200">{activeServerModal.track || 'N/D'}</strong> • Piloti connessi:{' '}
                    <strong className="text-amber-400">{Math.max(activeServerModal.players || 0, activeServerModal.playersList?.length || 0)}/{activeServerModal.maxPlayers}</strong>
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedLiveServerId(null)} className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 overflow-y-auto">
              {activeServerModal.playersList?.length > 0 ? (
                <div className="border border-gray-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#0e1118] text-[11px] uppercase text-gray-400">
                      <tr><th className="py-2.5 px-3 w-16"># Gara</th><th className="py-2.5 px-3">Pilota</th><th className="py-2.5 px-3">Vettura</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {activeServerModal.playersList.map((p: any) => (
                        <tr key={p.steamId} className="hover:bg-gray-800/30">
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-400">#{p.number}</td>
                          <td className="py-2.5 px-3 font-semibold text-white">
                            <span className="inline-flex items-center">
                              {p.name}
                              <NationFlag nation={p.nation} />
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-xs text-gray-300 flex items-center gap-1.5"><Car className="w-3.5 h-3.5 text-red-400 shrink-0" /> {p.car}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-10 text-center text-gray-400 space-y-1">
                  <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="font-semibold text-gray-300">Nessun pilota presente sul server in questo momento</p>
                  <p className="text-xs text-gray-500">Puoi riavviare o modificare questo server in tutta sicurezza.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODALE DETTAGLIO SESSIONE / GARA */}
      {(selectedSession || loadingSession) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedSession(null)}>
          <div className="bg-[#131720] border border-gray-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <TrackPreview trackName={selectedSession?.session?.track_name} className="w-16 h-11" />
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedSession?.session?.track_name} — {selectedSession?.session?.session_type}</h3>
                  <p className="text-xs text-gray-400">{selectedSession?.session?.server_name} • {selectedSession?.session?.played_at}</p>
                </div>
              </div>
              <button onClick={() => setSelectedSession(null)} className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"><X className="w-5 h-5" /></button>
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
                          <tr onClick={() => setExpandedDriverGuid(isExpanded ? null : r.driver_guid)} className={`cursor-pointer transition ${isExpanded ? 'bg-gray-800/60' : 'hover:bg-gray-800/30'}`}>
                            <td className="py-2.5 px-3 font-mono font-bold whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5">
                                {isQualy && r.position === 1 ? (
                                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-extrabold uppercase tracking-wide">Pole Position</span>
                                ) : (
                                  <span className="text-amber-400">P{r.position}</span>
                                )}
                                {isRace && gridPos !== null && posDelta > 0 && (
                                  <span
                                    title={`Partenza in griglia: P${gridPos} → Arrivo: P${r.position} (+${posDelta} posizioni)`}
                                    className="inline-flex items-center gap-0.5 text-emerald-400 cursor-help select-none"
                                  >
                                    <span className="text-[11px] leading-none">▲</span>
                                    <span className="text-[10px] font-bold">+{posDelta}</span>
                                  </span>
                                )}
                                {isRace && gridPos !== null && posDelta < 0 && (
                                  <span
                                    title={`Partenza in griglia: P${gridPos} → Arrivo: P${r.position} (${posDelta} posizioni)`}
                                    className="inline-flex items-center gap-0.5 text-red-500 cursor-help select-none"
                                  >
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
                                            <td className={`py-1.5 px-3 text-right font-mono font-bold ${l.is_valid ? (l.lap_time_ms === r.best_lap_ms ? 'text-emerald-400' : 'text-white') : 'text-red-400 line-through'}`}>
                                              {formatMs(l.lap_time_ms)}
                                            </td>
                                            <td className="py-1.5 px-3 text-center">
                                              {l.is_valid ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" /> : <AlertCircle className="w-3.5 h-3.5 text-red-500 inline" />}
                                            </td>
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
      )}

      {/* WIDGET CHATBOT */}
      <div className="fixed bottom-5 right-5 z-40">
        {chatOpen ? (
          <div className="w-80 sm:w-96 bg-[#131720] border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[440px]">
            <div className="bg-gradient-to-r from-red-700 to-red-900 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-white" />
                <div>
                  <h4 className="text-sm font-bold text-white leading-none">Assistente Tempi EVO</h4>
                  <span className="text-[10px] text-red-200">Cerca posizione e giri veloci</span>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="p-1 rounded-lg hover:bg-black/20 text-white transition"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#0b0d11]/90 text-xs">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 leading-relaxed ${msg.sender === 'user' ? 'bg-red-600 text-white rounded-br-none' : 'bg-[#171c28] text-gray-200 border border-gray-800 rounded-bl-none'}`}>
                    {msg.sender === 'bot' ? renderFormattedText(msg.text) : msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#171c28] text-gray-400 border border-gray-800 rounded-xl rounded-bl-none px-3 py-2 text-xs animate-pulse">Controllo la telemetria...</div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendChatMessage} className="p-2.5 bg-[#131720] border-t border-gray-800 flex items-center gap-2">
              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Es. Mario Rossi o Posizione Imola..." className="flex-1 bg-[#0b0d11] border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500" />
              <button type="submit" disabled={chatLoading || !chatInput.trim()} className="p-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white transition"><Send className="w-4 h-4" /></button>
            </form>
          </div>
        ) : (
          <button onClick={() => setChatOpen(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm px-4 py-3 rounded-full shadow-lg shadow-red-900/40 transition transform hover:scale-105">
            <MessageSquare className="w-4 h-4" />
            <span>Assistente Tempi</span>
          </button>
        )}
      </div>
    </div>
  );
}
