import React, { useEffect, useState } from 'react';
import { cloudStorage } from '../../services/storage/cloudStorage';
import { BarChart3, Users, FileImage, Calendar, ArrowLeft, TrendingUp, Clock, Medal, Sparkles, Download, Layers, Smartphone, Monitor, Globe, LogIn } from 'lucide-react';

// ── Theme ──────────────────────────────────────────────────────────────────────

const T = {
    bg: '#0A0A0F',
    card: 'rgba(255,255,255,0.03)',
    cardHover: 'rgba(255,255,255,0.06)',
    border: 'rgba(255,255,255,0.08)',
    text: '#FFFFFF',
    textSub: 'rgba(255,255,255,0.6)',
    textFaint: 'rgba(255,255,255,0.3)',
    accent: '#00E5C3',
    accentGlow: 'rgba(0,229,195,0.15)',
    red: '#FF6B6B',
    yellow: '#FFD93D',
    purple: '#A78BFA',
    silver: '#C0C0C0',
    bronze: '#CD7F32',
    blue: '#60A5FA',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

type DateFilter = 'today' | '7d' | '30d' | '60d' | 'all';

const DATE_FILTERS: { key: DateFilter; label: string }[] = [
    { key: 'today', label: 'Hoje' },
    { key: '7d', label: '7 dias' },
    { key: '30d', label: '30 dias' },
    { key: '60d', label: '60 dias' },
    { key: 'all', label: 'Todos' },
];

function getDateThreshold(filter: DateFilter): Date | null {
    const now = new Date();
    switch (filter) {
        case 'today': return new Date(now.getFullYear(), now.getMonth(), now.getDate());
        case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        case '60d': return new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        default: return null;
    }
}

function formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (diffMs < 0) return 'Agora';

    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (diffMins < 60) {
        return diffMins <= 1 ? 'Agora mesmo' : `há ${diffMins} min`;
    }
    if (diffHours < 24) {
        return `há ${diffHours}h`;
    }
    if (diffDays === 1) {
        return 'Ontem';
    }
    if (diffDays <= 7) {
        return `há ${diffDays} dias`;
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// ── Component ──────────────────────────────────────────────────────────────────

interface AnalyticsPageProps {
    onBack: () => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ onBack }) => {
    const [stats, setStats] = useState<{
        totalUsers: number;
        totalCarousels: number;
        userRanking: { email: string; count: number; lastCreated: string; createdAt: string; lastActivity: string; role: string }[];
    } | null>(null);
    const [exportStats, setExportStats] = useState<{
        totalExports: number;
        totalSlides: number;
        exportsByUser: { email: string; count: number; slides: number; lastExport: string }[];
    } | null>(null);
    const [loginStats, setLoginStats] = useState<{
        totalLogins: number;
        deviceBreakdown: { device: string; count: number }[];
        browserBreakdown: { browser: string; count: number }[];
        loginsByUser: { email: string; count: number; lastLogin: string; device: string }[];
        dailyLogins: { date: string; count: number }[];
    } | null>(null);
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'logins' | 'exports'>('overview');

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setLoading(true);
        const [data, exData, lgData] = await Promise.all([
            cloudStorage.getStats(),
            cloudStorage.getExportStats(),
            cloudStorage.getLoginStats(),
        ]);
        setStats(data);
        setExportStats(exData);
        setLoginStats(lgData);
        setLoading(false);
    };

    // Build usage ranking: merge logins + exports per user
    const usageMap = new Map<string, { email: string; logins: number; exports: number; usage: number; lastActivity: string; createdAt: string; role: string }>();

    // Add base users from stats
    stats?.userRanking.forEach(u => {
        usageMap.set(u.email, { email: u.email, logins: 0, exports: 0, usage: 0, lastActivity: u.lastActivity, createdAt: u.createdAt, role: u.role });
    });

    // Merge login counts
    loginStats?.loginsByUser.forEach(l => {
        const existing = usageMap.get(l.email);
        if (existing) {
            existing.logins = l.count;
            existing.usage += l.count;
            if (l.lastLogin > existing.lastActivity) existing.lastActivity = l.lastLogin;
        }
    });

    // Merge export counts
    exportStats?.exportsByUser.forEach(e => {
        const existing = usageMap.get(e.email);
        if (existing) {
            existing.exports = e.count;
            existing.usage += e.count * 3; // exports weigh more
            if (e.lastExport > existing.lastActivity) existing.lastActivity = e.lastExport;
        }
    });

    // Filter and sort
    const filteredRanking = Array.from(usageMap.values())
        .filter(u => {
            const threshold = getDateThreshold(dateFilter);
            if (!threshold) return true;
            return new Date(u.lastActivity) >= threshold;
        })
        .sort((a, b) => b.usage - a.usage);

    const filteredTotal = filteredRanking.reduce((sum, u) => sum + u.usage, 0);
    const maxCount = filteredRanking.length > 0 ? filteredRanking[0].usage : 1;

    // Computed stats
    const avgSlidesPerCarousel = stats && stats.totalCarousels > 0
        ? (filteredRanking.reduce((sum, u) => sum + u.usage, 0) / stats.totalCarousels).toFixed(1)
        : '0';
    const activeUsersToday = stats?.userRanking.filter(u => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(u.lastActivity) >= today;
    }).length || 0;

    // Device %
    const totalLoginCount = loginStats?.totalLogins || 1;
    const mobileLogins = loginStats?.deviceBreakdown.find(d => d.device === 'mobile')?.count || 0;
    const desktopLogins = loginStats?.deviceBreakdown.find(d => d.device === 'desktop')?.count || 0;
    const mobilePct = Math.round((mobileLogins / totalLoginCount) * 100);
    const desktopPct = Math.round((desktopLogins / totalLoginCount) * 100);

    // Daily chart max
    const dailyMax = loginStats?.dailyLogins.reduce((mx, d) => Math.max(mx, d.count), 1) || 1;

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

    return (
        <div className="fixed inset-0 overflow-auto no-scrollbar" style={{ background: T.bg }}>
            {/* ── Header ── */}
            <div className="sticky top-0 z-50 transition-all duration-300 backdrop-blur-3xl" style={{ background: 'rgba(10,10,15,0.7)', borderBottom: `1px solid ${T.border}` }}>
                <div className="max-w-5xl mx-auto px-4 sm:px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={onBack}
                            className="p-2.5 rounded-2xl transition-all hover:scale-105 active:scale-95 group"
                            style={{ background: T.card, border: `1px solid ${T.border}` }}
                        >
                            <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" style={{ color: T.text }} />
                        </button>
                        <div className="flex flex-col">
                            <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: T.text }}>
                                Insights
                            </h1>
                            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest" style={{ color: T.textSub }}>
                                Visão Geral da Plataforma
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={loadStats}
                        className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all active:scale-95 hover:scale-105"
                        style={{ background: T.card, border: `1px solid ${T.border}`, color: T.textSub }}
                    >
                        Atualizar
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-8 pb-32">
                {/* ── KPI Cards ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
                    {[
                        { icon: Users, label: 'Criadores', value: stats?.totalUsers || 0, glow: 'rgba(255,255,255,0.05)', iconColor: T.text },
                        { icon: FileImage, label: 'Carrosséis', value: stats?.totalCarousels || 0, glow: T.accentGlow, iconColor: T.accent },
                        { icon: Download, label: 'Downloads', value: exportStats?.totalExports || 0, glow: 'rgba(34,197,94,0.15)', iconColor: '#22c55e' },
                        { icon: LogIn, label: 'Logins', value: loginStats?.totalLogins || 0, glow: 'rgba(96,165,250,0.15)', iconColor: T.blue },
                    ].map((kpi) => (
                        <div key={kpi.label} className="rounded-[24px] p-5 sm:p-6 relative overflow-hidden group transition-all duration-300 hover:scale-[1.02]" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                            <div className="absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full -mr-16 -mt-16 group-hover:opacity-20 transition-opacity" style={{ background: kpi.glow }} />
                            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                                <div className="p-2 sm:p-2.5 rounded-xl" style={{ background: kpi.glow }}>
                                    <kpi.icon size={16} style={{ color: kpi.iconColor }} />
                                </div>
                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest" style={{ color: T.textFaint }}>{kpi.label}</span>
                            </div>
                            <p className="text-3xl sm:text-4xl font-black tracking-tight" style={{ color: T.text }}>{kpi.value}</p>
                        </div>
                    ))}
                </div>

                {/* ── Secondary KPIs ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-2xl p-4 flex flex-col" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                        <span className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: T.textFaint }}>Engajamento</span>
                        <div className="flex items-end gap-1">
                            <span className="text-2xl font-black" style={{ color: T.yellow }}>
                                {stats && stats.totalUsers > 0 ? (stats.totalCarousels / stats.totalUsers).toFixed(1) : '0'}
                            </span>
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
                            <Smartphone size={14} style={{ color: T.accent }} />
                            <span className="text-sm font-black" style={{ color: T.text }}>{mobilePct}%</span>
                            <Monitor size={14} style={{ color: T.blue }} />
                            <span className="text-sm font-black" style={{ color: T.text }}>{desktopPct}%</span>
                        </div>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div className="flex items-center gap-2 p-1 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                    {[
                        { key: 'overview' as const, label: 'Top Creators', icon: Medal },
                        { key: 'logins' as const, label: 'Logins', icon: LogIn },
                        { key: 'exports' as const, label: 'Downloads', icon: Download },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex-1 justify-center"
                            style={{
                                background: activeTab === tab.key ? T.accent : 'transparent',
                                color: activeTab === tab.key ? '#000' : T.textSub,
                                boxShadow: activeTab === tab.key ? `0 2px 10px ${T.accentGlow}` : 'none',
                            }}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── TAB: Overview / Top Creators ── */}
                {activeTab === 'overview' && (
                    <>
                        {/* Date Filters */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3 p-1.5 rounded-2xl overflow-x-auto no-scrollbar" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                                <div className="pl-3 pr-2 py-1 flex items-center gap-2 border-r" style={{ borderColor: T.border }}>
                                    <Calendar size={14} style={{ color: T.textSub }} />
                                </div>
                                {DATE_FILTERS.map(f => (
                                    <button
                                        key={f.key}
                                        onClick={() => setDateFilter(f.key)}
                                        className="px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all whitespace-nowrap"
                                        style={{
                                            background: dateFilter === f.key ? T.accent : 'transparent',
                                            color: dateFilter === f.key ? '#000' : T.textSub,
                                            boxShadow: dateFilter === f.key ? `0 2px 10px ${T.accentGlow}` : 'none',
                                        }}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                                <Sparkles size={14} style={{ color: T.accent }} />
                                <span className="text-xs font-black uppercase tracking-widest" style={{ color: T.text }}>
                                    <span style={{ color: T.accent }}>{filteredTotal}</span> Total no Período
                                </span>
                            </div>
                        </div>

                        {/* Ranking Table */}
                        <div className="rounded-[32px] overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                            <div className="px-6 sm:px-8 py-6 border-b flex items-center justify-between" style={{ borderColor: T.border }}>
                                <div className="flex items-center gap-3">
                                    <Medal size={20} style={{ color: T.text }} />
                                    <h2 className="text-lg font-black tracking-tight" style={{ color: T.text }}>Top Creators</h2>
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: T.textSub }}>
                                    Rank por Uso
                                </span>
                            </div>

                            {filteredRanking.length === 0 ? (
                                <div className="px-8 py-20 flex flex-col items-center justify-center text-center">
                                    <FileImage size={40} style={{ color: T.border, marginBottom: 16 }} />
                                    <h3 className="text-lg font-black" style={{ color: T.text }}>Nenhum dado encontrado</h3>
                                    <p className="text-sm mt-2 max-w-sm" style={{ color: T.textSub }}>Modifique o filtro de datas.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    <div className="grid grid-cols-[80px_1fr_120px_150px] gap-4 px-8 py-4 border-b text-[10px] font-black uppercase tracking-widest" style={{ borderColor: T.border, color: T.textFaint }}>
                                        <div className="text-center">Pos</div>
                                        <div>Criador / E-mail</div>
                                        <div className="text-right">Uso</div>
                                        <div className="text-right">Última Atividade</div>
                                    </div>

                                    <div className="divide-y" style={{ borderColor: T.border }}>
                                        {filteredRanking.map((user, idx) => {
                                            const isTop1 = idx === 0;
                                            const isTop2 = idx === 1;
                                            const isTop3 = idx === 2;
                                            const isPodium = idx < 3;

                                            const rankColor = isTop1 ? T.yellow : isTop2 ? T.silver : isTop3 ? T.bronze : T.card;
                                            const rankText = isPodium ? '#000' : T.textSub;
                                            const barWidth = Math.max(2, (user.usage / maxCount) * 100);

                                            return (
                                                <div
                                                    key={user.email}
                                                    className="grid grid-cols-1 sm:grid-cols-[80px_1fr_120px_150px] gap-3 sm:gap-4 px-6 sm:px-8 py-5 items-center relative overflow-hidden transition-all duration-300 hover:bg-white/5 group"
                                                >
                                                    <div
                                                        className="absolute left-0 bottom-0 h-full opacity-10 transition-all duration-700 ease-out z-0"
                                                        style={{
                                                            width: `${barWidth}%`,
                                                            background: isTop1 ? `linear-gradient(90deg, ${T.yellow}, transparent)` :
                                                                isPodium ? `linear-gradient(90deg, #ffffff, transparent)` :
                                                                    `linear-gradient(90deg, ${T.accent}, transparent)`
                                                        }}
                                                    />
                                                    <div className="flex sm:justify-center z-10">
                                                        <div
                                                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-lg"
                                                            style={{
                                                                background: rankColor,
                                                                color: rankText,
                                                                boxShadow: isPodium ? `0 4px 15px ${rankColor}40` : 'none',
                                                                border: isPodium ? 'none' : `1px solid ${T.border}`
                                                            }}
                                                        >
                                                            {idx + 1}
                                                        </div>
                                                    </div>
                                                    <div className="z-10 flex flex-col justify-center min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm sm:text-base font-bold truncate" style={{ color: isTop1 ? T.yellow : T.text }}>
                                                                {user.email}
                                                            </span>
                                                            {user.role === 'admin' && (
                                                                <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: T.yellow, color: '#000' }}>Admin</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                            <span className="text-[10px] font-medium flex items-center gap-1" style={{ color: T.textFaint }}>
                                                                <Calendar size={9} /> Cadastro: {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                                                            </span>
                                                            <span className="text-[10px] font-medium" style={{ color: T.accent }}>
                                                                Última: {formatRelativeTime(user.lastActivity)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="z-10 flex sm:justify-end items-center gap-2">
                                                        <div className="flex flex-col items-start sm:items-end">
                                                            <span className="text-xl sm:text-2xl font-black tabular-nums tracking-tight" style={{ color: isPodium ? T.text : T.accent }}>
                                                                {user.usage}
                                                            </span>
                                                            <span className="text-[8px] font-bold" style={{ color: T.textFaint }}>
                                                                {user.logins} logins · {user.exports} exports
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="z-10 flex sm:justify-end items-center gap-2">
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
                                                            <Clock size={11} style={{ color: T.accent }} />
                                                            <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap" style={{ color: T.textSub }}>
                                                                {formatRelativeTime(user.lastActivity)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* ── TAB: Logins ── */}
                {activeTab === 'logins' && loginStats && (
                    <div className="space-y-6">
                        {/* Daily Activity Chart */}
                        {loginStats.dailyLogins.length > 0 && (
                            <div className="rounded-[24px] p-6 sm:p-8" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                                <div className="flex items-center gap-3 mb-6">
                                    <BarChart3 size={20} style={{ color: T.blue }} />
                                    <h3 className="text-lg font-black tracking-tight" style={{ color: T.text }}>Atividade Diária (últimos 14 dias)</h3>
                                </div>
                                <div className="flex items-end gap-1.5 sm:gap-2" style={{ height: 120 }}>
                                    {loginStats.dailyLogins.map((day) => {
                                        const barH = Math.max(4, (day.count / dailyMax) * 100);
                                        const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                                        return (
                                            <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group" title={`${dayLabel}: ${day.count} logins`}>
                                                <span className="text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: T.accent }}>{day.count}</span>
                                                <div
                                                    className="w-full rounded-t-lg transition-all duration-300 group-hover:opacity-100"
                                                    style={{
                                                        height: `${barH}%`,
                                                        background: `linear-gradient(180deg, ${T.blue}, ${T.accent}40)`,
                                                        opacity: 0.7,
                                                        minHeight: 4,
                                                    }}
                                                />
                                                <span className="text-[8px] font-bold hidden sm:block" style={{ color: T.textFaint }}>{dayLabel}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Device & Browser Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="rounded-[24px] p-6" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                                <div className="flex items-center gap-3 mb-5">
                                    <Smartphone size={18} style={{ color: T.accent }} />
                                    <h3 className="text-base font-black tracking-tight" style={{ color: T.text }}>Dispositivos</h3>
                                </div>
                                <div className="space-y-3">
                                    {loginStats.deviceBreakdown.map(d => {
                                        const pct = Math.round((d.count / totalLoginCount) * 100);
                                        return (
                                            <div key={d.device} className="flex items-center gap-3">
                                                {d.device === 'mobile' ? <Smartphone size={14} style={{ color: T.accent }} /> : <Monitor size={14} style={{ color: T.blue }} />}
                                                <div className="flex-1">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-xs font-bold capitalize" style={{ color: T.text }}>{d.device}</span>
                                                        <span className="text-xs font-black" style={{ color: T.textSub }}>{d.count} ({pct}%)</span>
                                                    </div>
                                                    <div className="h-2 rounded-full overflow-hidden" style={{ background: T.bg }}>
                                                        <div
                                                            className="h-full rounded-full transition-all duration-700"
                                                            style={{
                                                                width: `${pct}%`,
                                                                background: d.device === 'mobile' ? T.accent : T.blue,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="rounded-[24px] p-6" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                                <div className="flex items-center gap-3 mb-5">
                                    <Globe size={18} style={{ color: T.purple }} />
                                    <h3 className="text-base font-black tracking-tight" style={{ color: T.text }}>Navegadores</h3>
                                </div>
                                <div className="space-y-3">
                                    {loginStats.browserBreakdown.map(b => {
                                        const pct = Math.round((b.count / totalLoginCount) * 100);
                                        const colors: Record<string, string> = { Chrome: '#4285F4', Safari: '#FF6A3D', Firefox: '#FF7139', Edge: '#0078D7', outro: T.textSub };
                                        return (
                                            <div key={b.browser} className="flex items-center gap-3">
                                                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: colors[b.browser] || T.textSub }} />
                                                <div className="flex-1">
                                                    <div className="flex justify-between mb-1">
                                                        <span className="text-xs font-bold" style={{ color: T.text }}>{b.browser}</span>
                                                        <span className="text-xs font-black" style={{ color: T.textSub }}>{b.count} ({pct}%)</span>
                                                    </div>
                                                    <div className="h-2 rounded-full overflow-hidden" style={{ background: T.bg }}>
                                                        <div
                                                            className="h-full rounded-full transition-all duration-700"
                                                            style={{
                                                                width: `${pct}%`,
                                                                background: colors[b.browser] || T.textSub,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Login History per User */}
                        {loginStats.loginsByUser.length > 0 && (
                            <div className="rounded-[24px] p-6 sm:p-8" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                                <div className="flex items-center gap-3 mb-6">
                                    <LogIn size={20} style={{ color: T.blue }} />
                                    <h3 className="text-lg font-black tracking-tight" style={{ color: T.text }}>Logins por Usuário</h3>
                                </div>
                                <div className="space-y-2">
                                    {loginStats.loginsByUser.map((user, idx) => (
                                        <div
                                            key={user.email}
                                            className="grid grid-cols-[1fr_auto_auto_auto] gap-3 sm:gap-6 items-center py-3 px-4 rounded-xl transition-all hover:scale-[1.01]"
                                            style={{
                                                background: idx === 0 ? 'rgba(96,165,250,0.08)' : T.bg,
                                                border: `1px solid ${idx === 0 ? 'rgba(96,165,250,0.2)' : T.border}`
                                            }}
                                        >
                                            <div className="min-w-0">
                                                <span className="text-sm font-bold truncate block" style={{ color: idx === 0 ? T.blue : T.text }}>
                                                    {user.email}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-lg font-black tabular-nums" style={{ color: T.text }}>{user.count}</span>
                                                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: T.textFaint }}>Logins</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {user.device === 'mobile' ? <Smartphone size={11} style={{ color: T.accent }} /> : <Monitor size={11} style={{ color: T.blue }} />}
                                                <span className="text-[10px] font-bold capitalize" style={{ color: T.textSub }}>{user.device}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
                                                <Clock size={11} style={{ color: T.accent }} />
                                                <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: T.textSub }}>
                                                    {formatRelativeTime(user.lastLogin)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── TAB: Exports / Downloads ── */}
                {activeTab === 'exports' && exportStats && (
                    <div className="space-y-6">
                        {/* Downloads Summary */}
                        <div className="grid grid-cols-2 gap-5">
                            <div className="rounded-[24px] p-6 relative overflow-hidden group transition-all" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                                <span className="text-[9px] font-black uppercase tracking-widest mb-3 block" style={{ color: T.textFaint }}>Total ZIPs Baixados</span>
                                <span className="text-4xl font-black" style={{ color: '#22c55e' }}>{exportStats.totalExports}</span>
                            </div>
                            <div className="rounded-[24px] p-6 relative overflow-hidden group transition-all" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                                <span className="text-[9px] font-black uppercase tracking-widest mb-3 block" style={{ color: T.textFaint }}>Slides Exportados</span>
                                <span className="text-4xl font-black" style={{ color: T.purple }}>{exportStats.totalSlides}</span>
                            </div>
                        </div>

                        {/* Downloads per User */}
                        {exportStats.exportsByUser.length > 0 && (
                            <div className="rounded-[24px] p-6 sm:p-8" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                                <div className="flex items-center gap-3 mb-6">
                                    <Download size={20} style={{ color: '#22c55e' }} />
                                    <h3 className="text-lg font-black tracking-tight" style={{ color: T.text }}>Downloads por Usuário</h3>
                                </div>
                                <div className="space-y-2">
                                    {exportStats.exportsByUser.map((user, idx) => (
                                        <div
                                            key={user.email}
                                            className="grid grid-cols-[1fr_auto_auto_auto] gap-3 sm:gap-6 items-center py-3 px-4 rounded-xl transition-all hover:scale-[1.01]"
                                            style={{
                                                background: idx === 0 ? 'rgba(34,197,94,0.08)' : T.bg,
                                                border: `1px solid ${idx === 0 ? 'rgba(34,197,94,0.2)' : T.border}`
                                            }}
                                        >
                                            <div className="min-w-0">
                                                <span className="text-sm font-bold truncate block" style={{ color: idx === 0 ? '#22c55e' : T.text }}>
                                                    {user.email}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-lg font-black tabular-nums" style={{ color: T.text }}>{user.count}</span>
                                                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: T.textFaint }}>ZIPs</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-lg font-black tabular-nums" style={{ color: '#a855f7' }}>{user.slides}</span>
                                                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: T.textFaint }}>Slides</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
                                                <Clock size={11} style={{ color: T.accent }} />
                                                <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: T.textSub }}>
                                                    {formatRelativeTime(user.lastExport)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
