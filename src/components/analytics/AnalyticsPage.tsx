import React, { useEffect, useState } from 'react';
import { cloudStorage } from '../../services/storage/cloudStorage';
import { BarChart3, Users, FileImage, Calendar, ArrowLeft, TrendingUp, Clock, Medal, Sparkles } from 'lucide-react';

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
        userRanking: { email: string; count: number; lastCreated: string }[];
    } | null>(null);
    const [dateFilter, setDateFilter] = useState<DateFilter>('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        setLoading(true);
        const data = await cloudStorage.getStats();
        setStats(data);
        setLoading(false);
    };

    // Filter ranking
    const filteredRanking = stats?.userRanking.filter(u => {
        const threshold = getDateThreshold(dateFilter);
        if (!threshold) return true;
        return new Date(u.lastCreated) >= threshold;
    }) || [];

    const filteredTotal = filteredRanking.reduce((sum, u) => sum + u.count, 0);
    const maxCount = filteredRanking.length > 0 ? filteredRanking[0].count : 1;

    // Split top creators
    const topCreators = filteredRanking.slice(0, 3);
    const otherUsers = filteredRanking.slice(3);

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
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5">
                    <div className="rounded-[24px] p-6 relative overflow-hidden group transition-all duration-300 hover:scale-[1.02]" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:opacity-10 transition-opacity" />
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
                                <Users size={18} style={{ color: T.text }} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textFaint }}>Criadores</span>
                        </div>
                        <p className="text-4xl sm:text-5xl font-black mt-2 tracking-tight" style={{ color: T.text }}>{stats?.totalUsers || 0}</p>
                    </div>

                    <div className="rounded-[24px] p-6 relative overflow-hidden group transition-all duration-300 hover:scale-[1.02]" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                        <div className="absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full -mr-16 -mt-16 group-hover:opacity-30 transition-opacity" style={{ background: T.accentGlow }} />
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-xl" style={{ background: T.accentGlow }}>
                                <FileImage size={18} style={{ color: T.accent }} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textFaint }}>Carrosséis</span>
                        </div>
                        <p className="text-4xl sm:text-5xl font-black mt-2 tracking-tight" style={{ color: T.text }}>{stats?.totalCarousels || 0}</p>
                    </div>

                    <div className="rounded-[24px] p-6 col-span-2 md:col-span-1 relative overflow-hidden group transition-all duration-300 hover:scale-[1.02]" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                        <div className="absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full -mr-16 -mt-16 group-hover:opacity-20 transition-opacity" style={{ background: 'rgba(255,217,61,0.15)' }} />
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 rounded-xl" style={{ background: 'rgba(255,217,61,0.1)' }}>
                                <TrendingUp size={18} style={{ color: T.yellow }} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: T.textFaint }}>Engajamento</span>
                        </div>
                        <div className="flex items-end gap-2 mt-2">
                            <p className="text-4xl sm:text-5xl font-black tracking-tight" style={{ color: T.text }}>
                                {stats && stats.totalUsers > 0 ? (stats.totalCarousels / stats.totalUsers).toFixed(1) : '0'}
                            </p>
                            <span className="text-sm font-bold pb-2" style={{ color: T.textSub }}>/ criador</span>
                        </div>
                    </div>
                </div>

                {/* ── Filters ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-8">
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

                {/* ── Ranking ── */}
                <div className="rounded-[32px] overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}` }}>
                    <div className="px-6 sm:px-8 py-6 border-b flex items-center justify-between" style={{ borderColor: T.border }}>
                        <div className="flex items-center gap-3">
                            <Medal size={20} style={{ color: T.text }} />
                            <h2 className="text-lg font-black tracking-tight" style={{ color: T.text }}>Top Creators</h2>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: T.textSub }}>
                            Rank por Volume
                        </span>
                    </div>

                    {filteredRanking.length === 0 ? (
                        <div className="px-8 py-20 flex flex-col items-center justify-center text-center">
                            <FileImage size={40} style={{ color: T.border, marginBottom: 16 }} />
                            <h3 className="text-lg font-black" style={{ color: T.text }}>Nenhum dado encontrado</h3>
                            <p className="text-sm mt-2 max-w-sm" style={{ color: T.textSub }}>Não existem carrosséis criados no período selecionado. Modifique o filtro de datas para ver o histórico mais antigo.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {/* Titulos da tabela */}
                            <div className="hidden sm:grid grid-cols-[80px_1fr_120px_150px] gap-4 px-8 py-4 border-b text-[10px] font-black uppercase tracking-widest" style={{ borderColor: T.border, color: T.textFaint }}>
                                <div className="text-center">Pos</div>
                                <div>Criador / E-mail</div>
                                <div className="text-right">Volume</div>
                                <div className="text-right">Última Atividade</div>
                            </div>

                            {/* Lista de usuários */}
                            <div className="divide-y" style={{ borderColor: T.border }}>
                                {filteredRanking.map((user, idx) => {
                                    const isTop1 = idx === 0;
                                    const isTop2 = idx === 1;
                                    const isTop3 = idx === 2;
                                    const isPodium = idx < 3;

                                    const rankColor = isTop1 ? T.yellow : isTop2 ? T.silver : isTop3 ? T.bronze : T.card;
                                    const rankText = isPodium ? '#000' : T.textSub;
                                    const barWidth = Math.max(2, (user.count / maxCount) * 100);

                                    return (
                                        <div
                                            key={user.email}
                                            className="grid grid-cols-1 sm:grid-cols-[80px_1fr_120px_150px] gap-3 sm:gap-4 px-6 sm:px-8 py-5 items-center relative overflow-hidden transition-all duration-300 hover:bg-white/5 group"
                                        >
                                            {/* Progress Bar Background */}
                                            <div
                                                className="absolute left-0 bottom-0 h-full opacity-10 transition-all duration-700 ease-out z-0"
                                                style={{
                                                    width: `${barWidth}%`,
                                                    background: isTop1 ? `linear-gradient(90deg, ${T.yellow}, transparent)` :
                                                        isPodium ? `linear-gradient(90deg, #ffffff, transparent)` :
                                                            `linear-gradient(90deg, ${T.accent}, transparent)`
                                                }}
                                            />

                                            {/* Rank Badge */}
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

                                            {/* Email */}
                                            <div className="z-10 flex flex-col justify-center min-w-0">
                                                <span className="text-sm sm:text-base font-bold truncate" style={{ color: isTop1 ? T.yellow : T.text }}>
                                                    {user.email}
                                                </span>
                                                <span className="text-[10px] font-medium uppercase mt-0.5" style={{ color: T.textFaint }}>
                                                    Membro Pro
                                                </span>
                                            </div>

                                            {/* Count */}
                                            <div className="z-10 flex sm:justify-end items-center gap-2">
                                                <div className="flex flex-col items-start sm:items-end">
                                                    <span className="text-xl sm:text-2xl font-black tabular-nums tracking-tight" style={{ color: isPodium ? T.text : T.accent }}>
                                                        {user.count}
                                                    </span>
                                                    <span className="text-[9px] font-bold uppercase tracking-widest sm:hidden" style={{ color: T.textFaint }}>
                                                        Carrosséis
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Last Activity */}
                                            <div className="z-10 flex sm:justify-end items-center gap-2">
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
                                                    <Clock size={11} style={{ color: T.accent }} />
                                                    <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap" style={{ color: T.textSub }}>
                                                        {formatRelativeTime(user.lastCreated)}
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
            </div>
        </div>
    );
};

