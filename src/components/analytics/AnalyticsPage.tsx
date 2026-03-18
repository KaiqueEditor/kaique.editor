import React, { useEffect, useState, useCallback } from 'react';
import { cloudStorage } from '../../services/storage/cloudStorage';
import { ROLE_LABELS, ROLE_COLORS, UserRole } from '../../hooks/useAdmin';
import {
  BarChart3, Users, FileImage, Calendar, ArrowLeft, TrendingUp, Clock, Medal,
  Sparkles, Download, Layers, Smartphone, Monitor, Globe, LogIn, Shield,
  Server, Database, HardDrive, ChevronDown, Search, Trash2, Crown, Eye,
  RefreshCw, Image as ImageIcon, Palette, Type, Package,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// ── Theme ──────────────────────────────────────────────────────────────────────
const T = {
  bg: '#0A0A0F', card: 'rgba(255,255,255,0.03)', cardHover: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.08)', text: '#FFFFFF', textSub: 'rgba(255,255,255,0.6)',
  textFaint: 'rgba(255,255,255,0.3)', accent: '#00E5C3', accentGlow: 'rgba(0,229,195,0.15)',
  red: '#FF6B6B', yellow: '#FFD93D', purple: '#A78BFA', silver: '#C0C0C0',
  bronze: '#CD7F32', blue: '#60A5FA',
};

// ── Helpers ────────────────────────────────────────────────────────────────────
type DateFilter = 'today' | '7d' | '30d' | '60d' | 'all';
const DATE_FILTERS: { key: DateFilter; label: string }[] = [
  { key: 'today', label: 'Hoje' }, { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' }, { key: '60d', label: '60 dias' },
  { key: 'all', label: 'Todos' },
];

function getDateThreshold(filter: DateFilter): Date | null {
  const now = new Date();
  switch (filter) {
    case 'today': return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case '7d': return new Date(now.getTime() - 7 * 864e5);
    case '30d': return new Date(now.getTime() - 30 * 864e5);
    case '60d': return new Date(now.getTime() - 60 * 864e5);
    default: return null;
  }
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 0) return 'Agora';
  const mins = Math.floor(diff / 6e4), hrs = Math.floor(diff / 36e5), days = Math.floor(diff / 864e5);
  if (mins < 60) return mins <= 1 ? 'Agora mesmo' : `há ${mins} min`;
  if (hrs < 24) return `há ${hrs}h`;
  if (days === 1) return 'Ontem';
  if (days <= 7) return `há ${days} dias`;
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// ── Types ──────────────────────────────────────────────────────────────────────
type MainTab = 'overview' | 'carousels' | 'users' | 'system';

interface AnalyticsPageProps { onBack: () => void; }

// ── Sub-Components ─────────────────────────────────────────────────────────────
const KPICard: React.FC<{ icon: any; label: string; value: number | string; glow: string; iconColor: string }> = ({ icon: Icon, label, value, glow, iconColor }) => (
  <div className="rounded-[24px] p-5 sm:p-6 relative overflow-hidden group transition-all duration-300 hover:scale-[1.02]" style={{ background: T.card, border: `1px solid ${T.border}` }}>
    <div className="absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full -mr-16 -mt-16 group-hover:opacity-20 transition-opacity" style={{ background: glow }} />
    <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
      <div className="p-2 sm:p-2.5 rounded-xl" style={{ background: glow }}><Icon size={16} style={{ color: iconColor }} /></div>
      <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest" style={{ color: T.textFaint }}>{label}</span>
    </div>
    <p className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: T.text }}>{value}</p>
  </div>
);

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const colors = ROLE_COLORS[role as UserRole] || ROLE_COLORS.creator;
  return (
    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: colors.bg, color: colors.text }}>
      {ROLE_LABELS[role as UserRole] || role}
    </span>
  );
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onBack }) => {
  const [mainTab, setMainTab] = useState<MainTab>('overview');
  const [stats, setStats] = useState<any>(null);
  const [exportStats, setExportStats] = useState<any>(null);
  const [loginStats, setLoginStats] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allCarousels, setAllCarousels] = useState<any[]>([]);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'logins' | 'exports'>('overview');
  const [userSearch, setUserSearch] = useState('');
  const [carouselSearch, setCarouselSearch] = useState('');

  const loadStats = useCallback(async () => {
    setLoading(true);
    const [data, exData, lgData, users, carousels, sysStats] = await Promise.all([
      cloudStorage.getStats(),
      cloudStorage.getExportStats(),
      cloudStorage.getLoginStats(),
      cloudStorage.getAllUsers(),
      cloudStorage.getAllCarousels(),
      cloudStorage.getSystemStats(),
    ]);
    setStats(data); setExportStats(exData); setLoginStats(lgData);
    setAllUsers(users); setAllCarousels(carousels); setSystemStats(sysStats);
    setLoading(false);
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const ok = await cloudStorage.updateUserRole(userId, newRole);
    if (ok) {
      toast.success('Role atualizado!');
      setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } else {
      toast.error('Erro ao atualizar role');
    }
  };

  // ── Computed data ────────────────────────────────────────────────────────
  const usageMap = new Map<string, any>();
  stats?.userRanking.forEach((u: any) => usageMap.set(u.email, { ...u, logins: 0, exports: 0, usage: 0 }));
  loginStats?.loginsByUser.forEach((l: any) => { const e = usageMap.get(l.email); if (e) { e.logins = l.count; e.usage += l.count; } });
  exportStats?.exportsByUser.forEach((ex: any) => { const e = usageMap.get(ex.email); if (e) { e.exports = ex.count; e.usage += ex.count * 3; } });

  const filteredRanking = Array.from(usageMap.values())
    .filter(u => { const th = getDateThreshold(dateFilter); return !th || new Date(u.lastActivity) >= th; })
    .sort((a, b) => b.usage - a.usage);
  const filteredTotal = filteredRanking.reduce((s, u) => s + u.usage, 0);
  const maxCount = filteredRanking[0]?.usage || 1;

  const activeUsersToday = stats?.userRanking.filter((u: any) => {
    const t = new Date(); t.setHours(0, 0, 0, 0); return new Date(u.lastActivity) >= t;
  }).length || 0;

  const totalLoginCount = loginStats?.totalLogins || 1;
  const mobilePct = Math.round(((loginStats?.deviceBreakdown.find((d: any) => d.device === 'mobile')?.count || 0) / totalLoginCount) * 100);
  const desktopPct = Math.round(((loginStats?.deviceBreakdown.find((d: any) => d.device === 'desktop')?.count || 0) / totalLoginCount) * 100);
  const dailyMax = loginStats?.dailyLogins.reduce((mx: number, d: any) => Math.max(mx, d.count), 1) || 1;

  const filteredUsers = allUsers.filter(u => !userSearch || u.email.toLowerCase().includes(userSearch.toLowerCase()));
  const filteredCarousels = allCarousels.filter((c: any) => !carouselSearch || (c.name || '').toLowerCase().includes(carouselSearch.toLowerCase()) || (c.email || '').toLowerCase().includes(carouselSearch.toLowerCase()));

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: T.bg }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-t-2 border-r-2 animate-spin" style={{ borderColor: T.accent }} />
          <p className="font-bold tracking-widest text-xs uppercase" style={{ color: T.textSub }}>Analisando Dados...</p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="fixed inset-0 overflow-auto no-scrollbar" style={{ background: T.bg }}>
      {/* ── Header ── */}
      <div className="sticky top-0 z-50 backdrop-blur-3xl" style={{ background: 'rgba(10,10,15,0.7)', borderBottom: `1px solid ${T.border}` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button onClick={onBack} className="p-2.5 rounded-2xl transition-all hover:scale-105 active:scale-95 group" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" style={{ color: T.text }} />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: T.text }}>CP-Analytics</h1>
              <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest" style={{ color: T.textSub }}>Painel Administrativo</p>
            </div>
          </div>
          <button onClick={loadStats} className="p-2.5 rounded-xl transition-all active:scale-95 hover:scale-105" style={{ background: T.card, border: `1px solid ${T.border}`, color: T.textSub }}>
            <RefreshCw size={16} />
          </button>
        </div>

        {/* ── Main Tabs ── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-3 flex gap-1 overflow-x-auto no-scrollbar">
          {([
            { key: 'overview' as MainTab, label: 'Overview', icon: BarChart3 },
            { key: 'carousels' as MainTab, label: 'Carrosséis', icon: Layers },
            { key: 'users' as MainTab, label: 'Usuários', icon: Users },
            { key: 'system' as MainTab, label: 'Sistema', icon: Server },
          ]).map(tab => (
            <button key={tab.key} onClick={() => setMainTab(tab.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap"
              style={{
                background: mainTab === tab.key ? T.accent : 'transparent',
                color: mainTab === tab.key ? '#000' : T.textSub,
                boxShadow: mainTab === tab.key ? `0 2px 10px ${T.accentGlow}` : 'none',
              }}>
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-8 pb-32">

        {/* ══════════════════════════════════════════════════════════════════
            TAB: OVERVIEW
        ══════════════════════════════════════════════════════════════════ */}
        {mainTab === 'overview' && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
              <KPICard icon={Users} label="Criadores" value={stats?.totalUsers || 0} glow="rgba(255,255,255,0.05)" iconColor={T.text} />
              <KPICard icon={FileImage} label="Carrosséis" value={stats?.totalCarousels || 0} glow={T.accentGlow} iconColor={T.accent} />
              <KPICard icon={Download} label="Downloads" value={exportStats?.totalExports || 0} glow="rgba(34,197,94,0.15)" iconColor="#22c55e" />
              <KPICard icon={LogIn} label="Logins" value={loginStats?.totalLogins || 0} glow="rgba(96,165,250,0.15)" iconColor={T.blue} />
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-2xl p-4 flex flex-col" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <span className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: T.textFaint }}>Engajamento</span>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-black" style={{ color: T.yellow }}>{stats && stats.totalUsers > 0 ? (stats.totalCarousels / stats.totalUsers).toFixed(1) : '0'}</span>
                  <span className="text-[10px] font-bold pb-1" style={{ color: T.textSub }}>/ criador</span>
                </div>
              </div>
              <div className="rounded-2xl p-4 flex flex-col" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <span className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: T.textFaint }}>Slides Baixados</span>
                <span className="text-2xl font-black" style={{ color: T.purple }}>{exportStats?.totalSlides || 0}</span>
              </div>
              <div className="rounded-2xl p-4 flex flex-col" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <span className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: T.textFaint }}>Ativos Hoje</span>
                <span className="text-2xl font-black" style={{ color: T.accent }}>{activeUsersToday}</span>
              </div>
              <div className="rounded-2xl p-4 flex flex-col" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                <span className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: T.textFaint }}>Mobile vs Desktop</span>
                <div className="flex items-center gap-2">
                  <Smartphone size={14} style={{ color: T.accent }} /><span className="text-sm font-black" style={{ color: T.text }}>{mobilePct}%</span>
                  <Monitor size={14} style={{ color: T.blue }} /><span className="text-sm font-black" style={{ color: T.text }}>{desktopPct}%</span>
                </div>
              </div>
            </div>

            {/* Sub-tabs: Top Creators / Logins / Exports */}
            <div className="flex items-center gap-2 p-1 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              {([
                { key: 'overview' as const, label: 'Top Creators', icon: Medal },
                { key: 'logins' as const, label: 'Logins', icon: LogIn },
                { key: 'exports' as const, label: 'Downloads', icon: Download },
              ]).map(tab => (
                <button key={tab.key} onClick={() => setActiveSubTab(tab.key)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex-1 justify-center"
                  style={{ background: activeSubTab === tab.key ? T.accent : 'transparent', color: activeSubTab === tab.key ? '#000' : T.textSub }}>
                  <tab.icon size={14} /> {tab.label}
                </button>
              ))}
            </div>

            {/* Sub-tab: Top Creators */}
            {activeSubTab === 'overview' && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 p-1.5 rounded-2xl overflow-x-auto no-scrollbar" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                    <div className="pl-3 pr-2 py-1 flex items-center gap-2 border-r" style={{ borderColor: T.border }}><Calendar size={14} style={{ color: T.textSub }} /></div>
                    {DATE_FILTERS.map(f => (
                      <button key={f.key} onClick={() => setDateFilter(f.key)} className="px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap"
                        style={{ background: dateFilter === f.key ? T.accent : 'transparent', color: dateFilter === f.key ? '#000' : T.textSub }}>
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                    <Sparkles size={14} style={{ color: T.accent }} />
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: T.text }}><span style={{ color: T.accent }}>{filteredTotal}</span> Total</span>
                  </div>
                </div>
                <div className="rounded-[32px] overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                  <div className="px-6 sm:px-8 py-6 border-b flex items-center justify-between" style={{ borderColor: T.border }}>
                    <div className="flex items-center gap-3"><Medal size={20} style={{ color: T.text }} /><h2 className="text-lg font-black tracking-tight" style={{ color: T.text }}>Top Creators</h2></div>
                  </div>
                  {filteredRanking.length === 0 ? (
                    <div className="px-8 py-20 flex flex-col items-center justify-center text-center">
                      <FileImage size={40} style={{ color: T.border, marginBottom: 16 }} />
                      <h3 className="text-lg font-black" style={{ color: T.text }}>Nenhum dado</h3>
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: T.border }}>
                      {filteredRanking.map((user, idx) => {
                        const isPodium = idx < 3;
                        const rankColor = idx === 0 ? T.yellow : idx === 1 ? T.silver : idx === 2 ? T.bronze : T.card;
                        const barW = Math.max(2, (user.usage / maxCount) * 100);
                        return (
                          <div key={user.email} className="grid grid-cols-1 sm:grid-cols-[80px_1fr_120px_150px] gap-3 sm:gap-4 px-6 sm:px-8 py-5 items-center relative overflow-hidden hover:bg-white/5">
                            <div className="absolute left-0 bottom-0 h-full opacity-10" style={{ width: `${barW}%`, background: `linear-gradient(90deg, ${idx === 0 ? T.yellow : T.accent}, transparent)` }} />
                            <div className="flex sm:justify-center z-10">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-lg" style={{ background: rankColor, color: isPodium ? '#000' : T.textSub, border: isPodium ? 'none' : `1px solid ${T.border}` }}>{idx + 1}</div>
                            </div>
                            <div className="z-10 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold truncate" style={{ color: idx === 0 ? T.yellow : T.text }}>{user.email}</span>
                                <RoleBadge role={user.role} />
                              </div>
                              <span className="text-[10px] font-medium" style={{ color: T.accent }}>Última: {formatRelativeTime(user.lastActivity)}</span>
                            </div>
                            <div className="z-10 flex sm:justify-end">
                              <div className="flex flex-col items-end">
                                <span className="text-xl font-black tabular-nums" style={{ color: T.accent }}>{user.usage}</span>
                                <span className="text-[8px] font-bold" style={{ color: T.textFaint }}>{user.logins} logins · {user.exports} exports</span>
                              </div>
                            </div>
                            <div className="z-10 flex sm:justify-end">
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
                                <Clock size={11} style={{ color: T.accent }} />
                                <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: T.textSub }}>{formatRelativeTime(user.lastActivity)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Sub-tab: Logins */}
            {activeSubTab === 'logins' && loginStats && (
              <div className="space-y-6">
                {loginStats.dailyLogins.length > 0 && (
                  <div className="rounded-[24px] p-6 sm:p-8" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center gap-3 mb-6"><BarChart3 size={20} style={{ color: T.blue }} /><h3 className="text-lg font-black" style={{ color: T.text }}>Atividade Diária</h3></div>
                    <div className="flex items-end gap-1.5 sm:gap-2" style={{ height: 120 }}>
                      {loginStats.dailyLogins.map((day: any) => {
                        const barH = Math.max(4, (day.count / dailyMax) * 100);
                        const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                        return (
                          <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group" title={`${dayLabel}: ${day.count}`}>
                            <span className="text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: T.accent }}>{day.count}</span>
                            <div className="w-full rounded-t-lg transition-all group-hover:opacity-100" style={{ height: `${barH}%`, background: `linear-gradient(180deg, ${T.blue}, ${T.accent}40)`, opacity: 0.7, minHeight: 4 }} />
                            <span className="text-[8px] font-bold hidden sm:block" style={{ color: T.textFaint }}>{dayLabel}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="rounded-[24px] p-6" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center gap-3 mb-5"><Smartphone size={18} style={{ color: T.accent }} /><h3 className="text-base font-black" style={{ color: T.text }}>Dispositivos</h3></div>
                    <div className="space-y-3">
                      {loginStats.deviceBreakdown.map((d: any) => {
                        const pct = Math.round((d.count / totalLoginCount) * 100);
                        return (
                          <div key={d.device} className="flex items-center gap-3">
                            {d.device === 'mobile' ? <Smartphone size={14} style={{ color: T.accent }} /> : <Monitor size={14} style={{ color: T.blue }} />}
                            <div className="flex-1">
                              <div className="flex justify-between mb-1"><span className="text-xs font-bold capitalize" style={{ color: T.text }}>{d.device}</span><span className="text-xs font-black" style={{ color: T.textSub }}>{d.count} ({pct}%)</span></div>
                              <div className="h-2 rounded-full overflow-hidden" style={{ background: T.bg }}><div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: d.device === 'mobile' ? T.accent : T.blue }} /></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="rounded-[24px] p-6" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center gap-3 mb-5"><Globe size={18} style={{ color: T.purple }} /><h3 className="text-base font-black" style={{ color: T.text }}>Navegadores</h3></div>
                    <div className="space-y-3">
                      {loginStats.browserBreakdown.map((b: any) => {
                        const pct = Math.round((b.count / totalLoginCount) * 100);
                        const colors: Record<string, string> = { Chrome: '#4285F4', Safari: '#FF6A3D', Firefox: '#FF7139', Edge: '#0078D7' };
                        return (
                          <div key={b.browser} className="flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: colors[b.browser] || T.textSub }} />
                            <div className="flex-1">
                              <div className="flex justify-between mb-1"><span className="text-xs font-bold" style={{ color: T.text }}>{b.browser}</span><span className="text-xs font-black" style={{ color: T.textSub }}>{b.count} ({pct}%)</span></div>
                              <div className="h-2 rounded-full overflow-hidden" style={{ background: T.bg }}><div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: colors[b.browser] || T.textSub }} /></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab: Exports */}
            {activeSubTab === 'exports' && exportStats && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-5">
                  <div className="rounded-[24px] p-6" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                    <span className="text-[9px] font-black uppercase tracking-widest mb-3 block" style={{ color: T.textFaint }}>Total ZIPs</span>
                    <span className="text-4xl font-black" style={{ color: '#22c55e' }}>{exportStats.totalExports}</span>
                  </div>
                  <div className="rounded-[24px] p-6" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                    <span className="text-[9px] font-black uppercase tracking-widest mb-3 block" style={{ color: T.textFaint }}>Slides Exportados</span>
                    <span className="text-4xl font-black" style={{ color: T.purple }}>{exportStats.totalSlides}</span>
                  </div>
                </div>
                {exportStats.exportsByUser.length > 0 && (
                  <div className="rounded-[24px] p-6 sm:p-8" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center gap-3 mb-6"><Download size={20} style={{ color: '#22c55e' }} /><h3 className="text-lg font-black" style={{ color: T.text }}>Downloads por Usuário</h3></div>
                    <div className="space-y-2">
                      {exportStats.exportsByUser.map((user: any, idx: number) => (
                        <div key={user.email} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 sm:gap-6 items-center py-3 px-4 rounded-xl" style={{ background: idx === 0 ? 'rgba(34,197,94,0.08)' : T.bg, border: `1px solid ${idx === 0 ? 'rgba(34,197,94,0.2)' : T.border}` }}>
                          <span className="text-sm font-bold truncate" style={{ color: idx === 0 ? '#22c55e' : T.text }}>{user.email}</span>
                          <div className="flex flex-col items-end"><span className="text-lg font-black tabular-nums" style={{ color: T.text }}>{user.count}</span><span className="text-[9px] font-bold uppercase" style={{ color: T.textFaint }}>ZIPs</span></div>
                          <div className="flex flex-col items-end"><span className="text-lg font-black tabular-nums" style={{ color: '#a855f7' }}>{user.slides}</span><span className="text-[9px] font-bold uppercase" style={{ color: T.textFaint }}>Slides</span></div>
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: T.bg, border: `1px solid ${T.border}` }}><Clock size={11} style={{ color: T.accent }} /><span className="text-[10px] font-bold" style={{ color: T.textSub }}>{formatRelativeTime(user.lastExport)}</span></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: CARROSSÉIS (Global Gallery)
        ══════════════════════════════════════════════════════════════════ */}
        {mainTab === 'carousels' && (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textFaint }} />
                <input value={carouselSearch} onChange={e => setCarouselSearch(e.target.value)} placeholder="Buscar por nome ou autor..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium focus:outline-none" style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }} />
              </div>
              <span className="text-xs font-black px-3 py-1.5 rounded-full" style={{ background: T.card, color: T.textSub }}>{filteredCarousels.length} projetos</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredCarousels.map((c: any) => (
                <div key={c.id} className="rounded-2xl overflow-hidden group transition-all hover:scale-[1.02]" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                  <div className="aspect-[3/4] relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {c.thumbnail_url ? (
                      <img src={c.thumbnail_url} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ImageIcon size={32} style={{ color: T.textFaint }} /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[9px] font-bold text-white/80">{c.slide_count || 0} slides</span>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-bold truncate" style={{ color: T.text }}>{c.name || 'Sem título'}</p>
                    <p className="text-[9px] font-medium mt-1 truncate" style={{ color: T.textFaint }}>{c.config?.branding || c.email || 'Autor desconhecido'}</p>
                    <p className="text-[9px] font-medium mt-0.5" style={{ color: T.textFaint }}>{formatRelativeTime(c.updated_at)}</p>
                  </div>
                </div>
              ))}
            </div>
            {filteredCarousels.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <Layers size={40} style={{ color: T.border }} />
                <p className="text-lg font-black mt-4" style={{ color: T.text }}>Nenhum carrossel encontrado</p>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: USUÁRIOS
        ══════════════════════════════════════════════════════════════════ */}
        {mainTab === 'users' && (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: T.textFaint }} />
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Buscar por email..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm font-medium focus:outline-none" style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }} />
              </div>
              <span className="text-xs font-black px-3 py-1.5 rounded-full" style={{ background: T.card, color: T.textSub }}>{filteredUsers.length} usuários</span>
            </div>
            <div className="rounded-[24px] overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <div className="hidden sm:grid grid-cols-[1fr_120px_140px_120px] gap-4 px-6 py-4 border-b text-[10px] font-black uppercase tracking-widest" style={{ borderColor: T.border, color: T.textFaint }}>
                <div>Email</div><div className="text-center">Role</div><div className="text-center">Cadastro</div><div className="text-center">Ações</div>
              </div>
              <div className="divide-y" style={{ borderColor: T.border }}>
                {filteredUsers.map(user => (
                  <div key={user.id} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_140px_120px] gap-3 sm:gap-4 px-6 py-4 items-center hover:bg-white/5 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black" style={{ background: ROLE_COLORS[user.role as UserRole]?.bg || T.card, color: ROLE_COLORS[user.role as UserRole]?.text || T.text }}>
                        {user.email[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-bold truncate" style={{ color: T.text }}>{user.email}</span>
                    </div>
                    <div className="flex justify-center"><RoleBadge role={user.role} /></div>
                    <div className="text-center"><span className="text-xs font-medium" style={{ color: T.textSub }}>{new Date(user.created_at).toLocaleDateString('pt-BR')}</span></div>
                    <div className="flex justify-center">
                      <select
                        value={user.role}
                        onChange={e => handleRoleChange(user.id, e.target.value)}
                        className="text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer focus:outline-none appearance-none"
                        style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.textSub }}
                      >
                        <option value="admin">Admin</option>
                        <option value="creator">Creator</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: SISTEMA
        ══════════════════════════════════════════════════════════════════ */}
        {mainTab === 'system' && systemStats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard icon={Users} label="Perfis" value={systemStats.totalProfiles} glow="rgba(255,255,255,0.05)" iconColor={T.text} />
              <KPICard icon={Layers} label="Carrosséis" value={systemStats.totalCarousels} glow={T.accentGlow} iconColor={T.accent} />
              <KPICard icon={LogIn} label="Logins" value={systemStats.totalLogins} glow="rgba(96,165,250,0.15)" iconColor={T.blue} />
              <KPICard icon={Download} label="Exports" value={systemStats.totalExports} glow="rgba(34,197,94,0.15)" iconColor="#22c55e" />
            </div>
            <div className="rounded-[24px] p-6 sm:p-8" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <div className="flex items-center gap-3 mb-6"><Server size={20} style={{ color: T.purple }} /><h3 className="text-lg font-black" style={{ color: T.text }}>Infraestrutura</h3></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: Database, label: 'Database', value: 'Supabase PostgreSQL', status: 'Ativo', color: '#22c55e' },
                  { icon: HardDrive, label: 'Storage', value: 'Supabase Storage', status: 'Ativo', color: '#22c55e' },
                  { icon: Shield, label: 'Auth', value: 'Supabase Auth + OAuth', status: 'Ativo', color: '#22c55e' },
                  { icon: Globe, label: 'CDN', value: 'Vercel Edge Network', status: 'Ativo', color: '#22c55e' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
                    <div className="p-2.5 rounded-xl" style={{ background: `${item.color}15` }}><item.icon size={18} style={{ color: item.color }} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold" style={{ color: T.text }}>{item.label}</p>
                      <p className="text-[10px] font-medium truncate" style={{ color: T.textFaint }}>{item.value}</p>
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full" style={{ background: `${item.color}15`, color: item.color }}>{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[24px] p-6" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <div className="flex items-center gap-3 mb-4"><Package size={18} style={{ color: T.accent }} /><h3 className="text-base font-black" style={{ color: T.text }}>Versão do App</h3></div>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-black" style={{ color: T.accent }}>v2.0</span>
                <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: T.accentGlow, color: T.accent }}>CarrosselPro</span>
                <span className="text-[10px] font-medium" style={{ color: T.textFaint }}>Fase 4 — Admin & Analytics</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
