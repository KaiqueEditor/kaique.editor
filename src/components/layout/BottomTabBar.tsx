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
            className="lg:hidden fixed bottom-0 left-0 right-0 z-[90] flex items-end justify-around"
            style={{
                height: 64,
                background: T.sidebar,
                borderTop: `1px solid ${T.border}`,
                paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
        >
            {TABS.map(({ key, icon, label, isCenter }) => {
                const isActive = activeTab === key;

                // Botão central em destaque (Pré Visualização)
                if (isCenter) {
                    return (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className="flex flex-col items-center justify-center gap-0.5 flex-1 transition-all duration-200 active:scale-90"
                            style={{ marginTop: -6 }}
                        >
                            <div
                                className="flex items-center justify-center rounded-2xl transition-all duration-300"
                                style={{
                                    width: 52,
                                    height: 34,
                                    background: isActive ? T.accent : `${T.accent}30`,
                                    color: isActive ? T.accentText : T.accent,
                                    boxShadow: isActive ? `0 4px 20px ${T.accent}40` : 'none',
                                }}
                            >
                                {icon}
                            </div>
                            <span
                                className="text-[8px] font-black tracking-wide"
                                style={{ color: isActive ? T.accent : T.textFaint }}
                            >
                                {label}
                            </span>
                        </button>
                    );
                }

                return (
                    <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 transition-all duration-200 active:scale-90"
                        style={{ color: isActive ? T.accent : T.textFaint }}
                    >
                        {/* Pill indicator */}
                        <div
                            className="flex items-center justify-center rounded-full transition-all duration-300"
                            style={{
                                width: isActive ? 44 : 32,
                                height: 26,
                                background: isActive ? `${T.accent}20` : 'transparent',
                            }}
                        >
                            {icon}
                        </div>
                        <span
                            className="text-[8px] font-bold tracking-wide"
                            style={{ opacity: isActive ? 1 : 0.6 }}
                        >
                            {label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
};
