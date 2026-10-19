import React, { useState, useEffect } from 'react';
import { Palette, Plus, X, Check, Trash2 } from 'lucide-react';
import { ThemeTokens, DARK_FALLBACK } from '../../constants/theme';
import { useStore } from '../../store';

interface CustomTheme {
    id: string;
    name: string;
    bgColor: string;
    titleColor: string;
    bodyColor: string;
    brandingColor: string;
}

const STORAGE_KEY = 'carrosselpro-custom-themes';

const loadThemes = (): CustomTheme[] => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch { return []; }
};

const saveThemesStorage = (themes: CustomTheme[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
};

interface CustomThemesProps {
    onClose: () => void;
    T?: ThemeTokens;
}

export const CustomThemes: React.FC<CustomThemesProps> = ({ onClose, T: TProp }) => {
    const T = TProp || DARK_FALLBACK;
    const sections = useStore(state => state.sections);
    const updateSection = useStore(state => state.updateSection);
    const [themes, setThemes] = useState<CustomTheme[]>(loadThemes);
    const [creating, setCreating] = useState(false);
    const [name, setName] = useState('');
    const [colors, setColors] = useState({
        bgColor: '#000000',
        titleColor: '#ffffff',
        bodyColor: '#cccccc',
        brandingColor: '#ffffff',
    });

    useEffect(() => {
        // Load current slide colors as default
        const s = sections[0];
        if (s) {
            setColors({
                bgColor: s.bgColor || '#000000',
                titleColor: s.titleColor || '#ffffff',
                bodyColor: s.bodyColor || '#cccccc',
                brandingColor: s.brandingColor || '#ffffff',
            });
        }
    }, []);

    const handleSave = () => {
        if (!name.trim()) return;
        const newTheme: CustomTheme = {
            id: Date.now().toString(),
            name: name.trim(),
            ...colors,
        };
        const updated = [...themes, newTheme];
        setThemes(updated);
        saveThemesStorage(updated);
        setCreating(false);
        setName('');
    };

    const handleDelete = (id: string) => {
        const updated = themes.filter(t => t.id !== id);
        setThemes(updated);
        saveThemesStorage(updated);
    };

    const applyTheme = (theme: CustomTheme) => {
        sections.forEach(s => {
            updateSection(s.id, {
                bgColor: theme.bgColor,
                titleColor: theme.titleColor,
                bodyColor: theme.bodyColor,
                brandingColor: theme.brandingColor,
            });
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-md mx-4 rounded-3xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}`, maxHeight: '80vh' }}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `1px solid ${T.border}` }}>
                    <div className="flex items-center gap-3">
                        <Palette size={20} style={{ color: T.accent }} />
                        <div>
                            <h2 className="text-lg font-black tracking-tight" style={{ color: T.textPrimary }}>Temas Personalizados</h2>
                            <p className="text-[11px] font-medium" style={{ color: T.textSub }}>Salve e reutilize suas paletas de cores</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl transition-all hover:scale-110" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
                        <X size={16} style={{ color: T.textSub }} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto no-scrollbar" style={{ maxHeight: 'calc(80vh - 80px)' }}>
                    {/* Saved themes */}
                    {themes.length > 0 && (
                        <div className="mb-6">
                            <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: T.textFaint }}>Seus temas</p>
                            <div className="space-y-2">
                                {themes.map(theme => (
                                    <div key={theme.id} className="flex items-center gap-3 rounded-xl px-4 py-3 group transition-all hover:scale-[1.01]" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
                                        {/* Color strip */}
                                        <div className="flex gap-1 flex-shrink-0">
                                            {[theme.bgColor, theme.titleColor, theme.bodyColor, theme.brandingColor].map((c, i) => (
                                                <div key={i} className="w-5 h-5 rounded-md" style={{ background: c, border: `1px solid ${T.border}` }} />
                                            ))}
                                        </div>
                                        <span className="flex-1 text-xs font-bold truncate" style={{ color: T.textPrimary }}>{theme.name}</span>
                                        <button
                                            onClick={() => applyTheme(theme)}
                                            className="px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all active:scale-95"
                                            style={{ background: T.accent, color: T.accentText }}
                                        >Aplicar</button>
                                        <button
                                            onClick={() => handleDelete(theme.id)}
                                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20"
                                            style={{ color: '#ef4444' }}
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Create new */}
                    {creating ? (
                        <div className="rounded-2xl p-5 space-y-4" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
                            <input
                                autoFocus
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Nome do tema..."
                                className="w-full px-4 py-2.5 rounded-xl text-sm font-bold outline-none"
                                style={{ background: T.glassMd, border: `1px solid ${T.border}`, color: T.textPrimary }}
                                onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setCreating(false); }}
                            />

                            <div className="grid grid-cols-4 gap-3">
                                {[
                                    { label: 'Fundo', key: 'bgColor' },
                                    { label: 'Título', key: 'titleColor' },
                                    { label: 'Texto', key: 'bodyColor' },
                                    { label: 'Autor', key: 'brandingColor' },
                                ].map(({ label, key }) => (
                                    <div key={key} className="flex flex-col items-center gap-1.5">
                                        <div className="w-full aspect-square rounded-xl relative overflow-hidden" style={{ background: (colors as any)[key], border: `2px solid ${T.border}` }}>
                                            <input
                                                type="color"
                                                value={(colors as any)[key]}
                                                onChange={e => setColors(prev => ({ ...prev, [key]: e.target.value }))}
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                            />
                                        </div>
                                        <span className="text-[8px] font-bold uppercase" style={{ color: T.textFaint }}>{label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Preview */}
                            <div className="rounded-xl p-4" style={{ background: colors.bgColor, border: `1px solid ${T.border}` }}>
                                <p className="text-sm font-black mb-1" style={{ color: colors.titleColor }}>Título Preview</p>
                                <p className="text-xs" style={{ color: colors.bodyColor }}>Texto do corpo aqui</p>
                                <p className="text-[10px] mt-2 font-bold" style={{ color: colors.brandingColor }}>@autor</p>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={handleSave}
                                    className="flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-95"
                                    style={{ background: T.accent, color: T.accentText }}
                                >
                                    <Check size={14} /> Salvar Tema
                                </button>
                                <button
                                    onClick={() => setCreating(false)}
                                    className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                                    style={{ background: T.glass, border: `1px solid ${T.border}`, color: T.textSub }}
                                >Cancelar</button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setCreating(true)}
                            className="w-full py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 hover:scale-[1.01]"
                            style={{ background: T.bg, border: `1.5px dashed ${T.border}`, color: T.textSub }}
                        >
                            <Plus size={16} /> Criar novo tema
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
