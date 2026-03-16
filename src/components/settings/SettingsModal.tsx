import React from 'react';
import { X, Settings, Image as ImageIcon, CheckCircle, Tag } from 'lucide-react';
import { useStore } from '../../store';
import { getTheme } from '../../constants/theme';
import { ProjectConfig } from '../../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const theme = useStore(s => s.theme);
    const T = getTheme(theme);
    const config = useStore(s => s.config);
    const updateConfig = useStore(s => s.updateConfig);

    if (!isOpen) return null;

    const handleChange = (key: keyof ProjectConfig, value: any) => {
        updateConfig({ [key]: value });
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div 
                className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                style={{ background: T.sidebar, border: `1px solid ${T.border}` }}
            >
                {/* Header */}
                <div className="px-6 py-5 flex items-center justify-between border-b" style={{ borderColor: T.border }}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl" style={{ background: T.glass }}>
                            <Settings size={20} style={{ color: T.accent }} />
                        </div>
                        <h2 className="text-lg font-black tracking-tight" style={{ color: T.textPrimary }}>Configurações</h2>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-all">
                        <X size={20} style={{ color: T.textSub }} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    
                    {/* Handle / Nome */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: T.textFaint }}>
                            <Tag size={12} /> Assinatura / Handle
                        </label>
                        <input
                            type="text"
                            value={config.handle || ''}
                            onChange={(e) => handleChange('handle', e.target.value)}
                            placeholder="@seuusuario"
                            className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                            style={{ 
                                background: T.card, 
                                border: `1px solid ${T.border}`, 
                                color: T.textPrimary,
                                ringColor: T.accent
                            }}
                        />
                        <p className="text-[10px]" style={{ color: T.textSub }}>Utilizado como texto padrão nos slides de capa e encerramento, e rodapés gerais.</p>
                    </div>

                    {/* Branding */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: T.textFaint }}>
                            <CheckCircle size={12} /> Branding Pessoal
                        </label>
                        <input
                            type="text"
                            value={config.branding || ''}
                            onChange={(e) => handleChange('branding', e.target.value)}
                            placeholder="Seu Nome ou Marca"
                            className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                            style={{ 
                                background: T.card, 
                                border: `1px solid ${T.border}`, 
                                color: T.textPrimary,
                                ringColor: T.accent
                            }}
                        />
                         <p className="text-[10px]" style={{ color: T.textSub }}>Aparece em layouts onde a marca pessoal fica visível na página.</p>
                    </div>

                    {/* Marca D'Água */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest" style={{ color: T.textFaint }}>
                            <ImageIcon size={12} /> Marca D'água do Exportador
                        </label>
                        <input
                            type="text"
                            value={config.watermark || ''}
                            onChange={(e) => handleChange('watermark', e.target.value)}
                            placeholder="@suamarca"
                            className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-2"
                            style={{ 
                                background: T.card, 
                                border: `1px solid ${T.border}`, 
                                color: T.textPrimary,
                                ringColor: T.accent
                            }}
                        />
                        <p className="text-[10px]" style={{ color: T.textSub }}>Se definido, aparecerá discretamente no rodapé de todas as imagens exportadas.</p>
                    </div>

                </div>
            </div>
        </div>
    );
};
