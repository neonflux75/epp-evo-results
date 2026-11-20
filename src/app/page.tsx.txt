'use client';
import React, { useEffect, useState } from 'react';
import { Trophy, Flag, Users, Timer, Activity } from 'lucide-react';
import { setCookie, getCookie } from '@/lib/evoUtils';
import { useLanguage, LanguageSwitcher } from '@/context/LanguageContext';
import { LiveServersSection } from '@/components/LiveServersSection';
import { LeaderboardSection } from '@/components/LeaderboardSection';
import { SessionsSection } from '@/components/SessionsSection';
import { TrackRecordsSection, DriversRosterSection } from '@/components/RecordsAndDriversSection';
import { DriverProfileModal } from '@/components/DriverProfileModal';
import { TelemetryChatWidget } from '@/components/TelemetryChatWidget';
import { FeatureRequestWidget } from '@/components/FeatureRequestWidget';

export default function EvoResultsDashboard() {
  const { dict } = useLanguage();
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

  useEffect(() => {
    const t = getCookie('evo_active_tab');
    if (t === 'leaderboard' || t === 'sessions' || t === 'records' || t === 'drivers') setActiveTab(t);
    const tr = getCookie('evo_top100_track'); if (tr) setSelectedTrack(tr);
    const ca = getCookie('evo_top100_car'); if (ca) setSelectedCar(ca);
    const str = getCookie('evo_session_track'); if (str) setSelectedSessionTrack(str);
    const sty = getCookie('evo_session_type'); if (sty) setSelectedSessionType(sty);
    setCookiesLoaded(true);
  }, []);

  const getViewerId = () => {
    if (typeof window === 'undefined') return '';
    let id = sessionStorage.getItem('evo_viewer_id');
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem('evo_viewer_id', id);
    }
    return id;
  };

  const fetchDashboard = async (track = selectedTrack, car = selectedCar) => {
    try {
      const vId = getViewerId();
      const carParam = car && car !== 'ALL' ? `&car=${encodeURIComponent(car)}` : '';
      const res = await fetch(`/api/dashboard?viewerId=${encodeURIComponent(vId)}${track ? `&track=${encodeURIComponent(track)}` : ''}${carParam}`);
      const json = await res.json();
      if (json.tracks?.length > 0) {
        const exists = json.tracks.some((t: any) => t.track_name === track);
        if (!track || !exists) {
          const rnd = json.tracks[Math.floor(Math.random() * json.tracks.length)].track_name;
          setSelectedTrack(rnd);
          setCookie('evo_top100_track', rnd);
          const r2 = await fetch(`/api/dashboard?viewerId=${encodeURIComponent(vId)}&track=${encodeURIComponent(rnd)}`);
          setData(await r2.json());
          return;
        }
      }
      setData(json);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!cookiesLoaded) return;
    fetchDashboard(selectedTrack, selectedCar);
    const iv = setInterval(() => fetchDashboard(selectedTrack, selectedCar), 30000);
    return () => clearInterval(iv);
  }, [selectedTrack, selectedCar, cookiesLoaded]);

  const openSessionDetails = async (id: number, groupIds?: number[]) => {
    setLoadingSession(true);
    setExpandedDriverGuid(null);
    try {
      const idsParam = groupIds && groupIds.length > 0 ? `&eventIds=${groupIds.join(',')}` : '';
      const res = await fetch(`/api/dashboard?sessionId=${id}${idsParam}`);
      setSelectedSession(await res.json());
    } catch {}
    setLoadingSession(false);
  };

  const openDriverProfile = async (guid: string, name?: string, nation?: string) => {
    if (!guid) return;
    setLoadingDriverProfile(true);
    setSelectedDriverProfile({ driver: { driver_guid: guid, driver_name: name || dict.common.driver, nation: nation || '' }, laps: [] });
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
          <Activity className="animate-spin" /> {dict.common.loading}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0d11] text-gray-100 font-sans selection:bg-red-600 selection:text-white">
      <div className="relative w-full h-24 sm:h-28 overflow-hidden border-b border-red-900/50 bg-[#0b0d11]">
        <img src="/assets/banner-epp.png" alt="=EPP= Racing Team" className="w-full h-full object-cover object-center opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b0d11]/85 via-[#0b0d11]/35 to-[#0b0d11]/85" />
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <h2 style={{ fontFamily: 'var(--font-orbitron), sans-serif' }} className="text-2xl sm:text-4xl md:text-5xl font-black italic tracking-[0.14em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-red-500 drop-shadow-[0_0_22px_rgba(239,68,68,0.85)] select-none text-center">
            =EPP= <span className="text-red-500">Racing</span> Team
          </h2>
        </div>
      </div>

      <header className="border-b border-gray-800/80 bg-[#11141b]/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center font-black text-white tracking-tighter shadow-lg shadow-red-900/30">EVO</div>
            <div>
              <h1 className="text-lg font-extrabold tracking-wider text-white flex items-center gap-2">EVO <span className="text-red-500">RESULTS</span></h1>
              <p className="text-[11px] text-gray-400 uppercase tracking-widest hidden sm:block">{dict.nav.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="flex items-center gap-1 sm:gap-2">
              {[
                { id: 'leaderboard', label: dict.nav.leaderboard, Icon: Timer },
                { id: 'sessions', label: dict.nav.sessions, Icon: Flag },
                { id: 'records', label: dict.nav.records, Icon: Trophy },
                { id: 'drivers', label: dict.nav.drivers, Icon: Users },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => { setActiveTab(id as any); setCookie('evo_active_tab', id); }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition ${activeTab === id ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800/60'}`}
                >
                  <Icon className="w-4 h-4" /> <span className="hidden md:inline">{label}</span>
                </button>
              ))}
            </nav>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <LiveServersSection
          liveServers={data.liveServers}
          onlineViewers={data.onlineViewers}
          selectedLiveServerId={selectedLiveServerId}
          onSelectServer={setSelectedLiveServerId}
        />

        {activeTab === 'leaderboard' && (
          <LeaderboardSection
            tracks={data.tracks}
            leaderboard={data.leaderboard}
            availableCars={data.availableCars}
            selectedTrack={selectedTrack}
            selectedCar={selectedCar}
            onTrackChange={(v) => { setSelectedTrack(v); setCookie('evo_top100_track', v); setSelectedCar('ALL'); setCookie('evo_top100_car', 'ALL'); }}
            onCarChange={(v) => { setSelectedCar(v); setCookie('evo_top100_car', v); }}
            onOpenDriver={openDriverProfile}
          />
        )}

        {activeTab === 'sessions' && (
          <SessionsSection
            tracks={data.tracks}
            sessions={data.sessions}
            selectedSessionTrack={selectedSessionTrack}
            selectedSessionType={selectedSessionType}
            onSessionTrackChange={(v) => { setSelectedSessionTrack(v); setCookie('evo_session_track', v); }}
            onSessionTypeChange={(v) => { setSelectedSessionType(v); setCookie('evo_session_type', v); }}
            selectedSession={selectedSession}
            loadingSession={loadingSession}
            expandedDriverGuid={expandedDriverGuid}
            onOpenSession={openSessionDetails}
            onCloseSession={() => setSelectedSession(null)}
            onToggleDriverLaps={setExpandedDriverGuid}
          />
        )}

        {activeTab === 'records' && <TrackRecordsSection trackRecords={data.trackRecords} />}

        {activeTab === 'drivers' && <DriversRosterSection drivers={data.drivers} onOpenDriver={openDriverProfile} />}
      </main>

      <DriverProfileModal profile={selectedDriverProfile} loading={loadingDriverProfile} onClose={() => setSelectedDriverProfile(null)} />
      <FeatureRequestWidget />
      <TelemetryChatWidget />
    </div>
  );
}
