import React from 'react';
import { PenLine, FolderOpen, Eye, Layers, Settings } from 'lucide-react';
import { useStore } from '../../store';
import { getTheme } from '../../constants/theme';

type Tab = 'editor' | 'projects' | 'preview' | 'create' | 'settings';

const TABS: { key: Tab; icon: React.ReactNode; label: string; isCenter?: boolean }[] = [
    { key: 'editor', icon: <PenLine size={20} />, label: 'Editor' },
    { key: 'projects', icon: <FolderOpen size={20} />, label: 'Projetos' },
    { key: 'preview', icon: <Eye size={22} />, label: 'Preview', isCenter: true },
    { key: 'create', icon: <Layers size={20} />, label: 'Criar' },
    { key: 'settings', icon: <Settings size={20} />, label: 'Ajustes' },
];

export const BottomTabBar: React.FC = () => {
    const activeTab = useStore(state => state.mobileActiveTab);
    const setActiveTab = useStore(state => state.setMobileActiveTab);
    const theme = useStore(state => state.theme);
    const T = getTheme(theme);

    return (
        <nav
            className="lg:hidden fixed z-[90] flex items-center gap-1 rounded-[24px] shadow-2xl transition-all duration-300"
            style={{
                bottom: 'calc(env(safe-area-inset-bottom, 16px) + 16px)',
                left: '50%',
                transform: 'translateX(-50%)',
                background: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                border: `1px solid ${T.border}`,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                padding: '6px',
            }}
        >
            {TABS.map(({ key, icon, isCenter }, index) => {
                const isActive = activeTab === key;

                return (
                    <React.Fragment key={key}>
                        <button
                            onClick={() => setActiveTab(key)}
                            className="flex items-center justify-center transition-all duration-200 active:scale-90"
                            style={{
                                width: isCenter ? 54 : 44,
                                height: 38,
                                borderRadius: 16,
                                background: isActive ? (isCenter ? T.accent : (theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)')) : 'transparent',
                                color: isActive ? (isCenter ? T.accentText : T.textPrimary) : T.textSub,
                                boxShadow: isActive && isCenter ? `0 4px 20px ${T.accent}40` : 'none',
                            }}
                        >
                            {icon}
                        </button>

                        {/* Custom divider before 'settings' or 'history' if needed to mimic desktop, or just a small gap. Here we just rely on standard gaps. */}
                        {index === 2 && (
                            <div style={{ width: 1, height: 20, background: T.border, margin: '0 4px' }} />
                        )}
                    </React.Fragment>
                );
            })}
        </nav>
    );
};
