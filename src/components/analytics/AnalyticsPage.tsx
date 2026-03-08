import React, { useEffect, useState } from 'react';
import { cloudStorage } from '../../services/storage/cloudStorage';
import { BarChart3, Users, FileImage, Calendar, ArrowLeft, TrendingUp, Clock } from 'lucide-react';

// ── Theme ──────────────────────────────────────────────────────────────────────

const T = {
    bg: '#0A0A0F',
    card: 'rgba(255,255,255,0.04)',
    cardHover: 'rgba(255,255,255,0.07)',
    border: 'rgba(255,255,255,0.08)',
    text: '#FFFFFF',
    textSub: 'rgba(255,255,255,0.6)',
    textFaint: 'rgba(255,255,255,0.3)',
    accent: '#00E5C3',
    accentGlow: 'rgba(0,229,195,0.2)',
    red: '#FF6B6B',
    yellow: '#FFD93D',
    purple: '#A78BFA',
};

// ── Date Filters ───────────────────────────────────────────────────────────────

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

    // Filtrar ranking por data
    const filteredRanking = stats?.userRanking.filter(u => {
        const threshold = getDateThreshold(dateFilter);
        if (!threshold) return true;
        return new Date(u.lastCreated) >= threshold;
    }) || [];

    const filteredTotal = filteredRanking.reduce((sum, u) => sum + u.count, 0);

    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center" style={{ background: T.bg }}>
                <div className="flex flex-col items-center gap-3">
                    <BarChart3 size={48} className="animate-pulse" style={{ color: T.accent }} />
                    <p style={{ color: T.textSub }}>Carregando analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 overflow-auto" style={{ background: T.bg }}>
            {/* Header */}
            <div className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{ background: 'rgba(10,10,15,0.9)', borderColor: T.border }}>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-xl transition-all hover:scale-105 active:scale-95"
                        style={{ background: T.card, border: `1px solid ${T.border}` }}
                    >
                        <ArrowLeft size={18} style={{ color: T.text }} />
                    </button>
                    <div className="flex items-center gap-2">
                        <BarChart3 size={22} style={{ color: T.accent }} />
                        <h1 className="text-lg font-black" style={{ color: T.text }}>Analytics</h1>
                    </div>
                    <button
                        onClick={loadStats}
                        className="ml-auto px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
                        style={{ background: T.card, border: `1px solid ${T.border}`, color: T.textSub }}
                    >
                        ↻ Atualizar
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="rounded-2xl p-5 border" style={{ background: T.card, borderColor: T.border }}>
                        <div className="flex items-center gap-2 mb-3">
                            <Users size={16} style={{ color: T.accent }} />
                            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: T.textFaint }}>Usuários</span>
                        </div>
                        <p className="text-3xl font-black" style={{ color: T.text }}>{stats?.totalUsers || 0}</p>
                        <p className="text-[10px] mt-1" style={{ color: T.textSub }}>cadastrados</p>
                    </div>

                    <div className="rounded-2xl p-5 border" style={{ background: T.card, borderColor: T.border }}>
                        <div className="flex items-center gap-2 mb-3">
                            <FileImage size={16} style={{ color: T.purple }} />
                            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: T.textFaint }}>Carrosséis</span>
                        </div>
                        <p className="text-3xl font-black" style={{ color: T.text }}>{stats?.totalCarousels || 0}</p>
                        <p className="text-[10px] mt-1" style={{ color: T.textSub }}>total gerados</p>
                    </div>

                    <div className="rounded-2xl p-5 border col-span-2 sm:col-span-1" style={{ background: T.card, borderColor: T.border }}>
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp size={16} style={{ color: T.yellow }} />
                            <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: T.textFaint }}>Média</span>
                        </div>
                        <p className="text-3xl font-black" style={{ color: T.text }}>
                            {stats && stats.totalUsers > 0
                                ? (stats.totalCarousels / stats.totalUsers).toFixed(1)
                                : '0'}
                        </p>
                        <p className="text-[10px] mt-1" style={{ color: T.textSub }}>carrosséis/usuário</p>
                    </div>
                </div>

                {/* Date Filter */}
                <div className="flex items-center gap-2">
                    <Calendar size={14} style={{ color: T.textFaint }} />
                    <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: T.textFaint }}>Período:</span>
                    <div className="flex gap-1.5 ml-1">
                        {DATE_FILTERS.map(f => (
                            <button
                                key={f.key}
                                onClick={() => setDateFilter(f.key)}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all active:scale-95"
                                style={{
                                    background: dateFilter === f.key ? T.accent : T.card,
                                    color: dateFilter === f.key ? '#000' : T.textSub,
                                    border: `1px solid ${dateFilter === f.key ? T.accent : T.border}`,
                                }}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <span className="ml-auto text-xs font-bold" style={{ color: T.textSub }}>
                        {filteredTotal} carrosséis
                    </span>
                </div>

                {/* Ranking Table */}
                <div className="rounded-2xl border overflow-hidden" style={{ background: T.card, borderColor: T.border }}>
                    <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: T.border }}>
                        <TrendingUp size={16} style={{ color: T.accent }} />
                        <h2 className="text-sm font-black" style={{ color: T.text }}>Ranking de Usuários</h2>
                    </div>

                    {filteredRanking.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-sm" style={{ color: T.textFaint }}>Nenhum carrossel neste período</p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-wider" style={{ color: T.textFaint }}>#</th>
                                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-wider" style={{ color: T.textFaint }}>Usuário</th>
                                    <th className="text-right px-5 py-3 text-[10px] font-black uppercase tracking-wider" style={{ color: T.textFaint }}>Carrosséis</th>
                                    <th className="text-right px-5 py-3 text-[10px] font-black uppercase tracking-wider hidden sm:table-cell" style={{ color: T.textFaint }}>Último</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRanking.map((user, i) => (
                                    <tr
                                        key={user.email}
                                        className="transition-colors"
                                        style={{ borderBottom: `1px solid ${T.border}` }}
                                        onMouseEnter={e => (e.currentTarget.style.background = T.cardHover)}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <td className="px-5 py-3">
                                            <span
                                                className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black"
                                                style={{
                                                    background: i === 0 ? T.accent : i === 1 ? T.yellow : i === 2 ? T.purple : T.card,
                                                    color: i < 3 ? '#000' : T.textSub,
                                                }}
                                            >
                                                {i + 1}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="text-sm font-medium" style={{ color: T.text }}>{user.email}</span>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <span className="text-sm font-black" style={{ color: T.accent }}>{user.count}</span>
                                        </td>
                                        <td className="px-5 py-3 text-right hidden sm:table-cell">
                                            <div className="flex items-center justify-end gap-1">
                                                <Clock size={11} style={{ color: T.textFaint }} />
                                                <span className="text-xs" style={{ color: T.textSub }}>
                                                    {new Date(user.lastCreated).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};
