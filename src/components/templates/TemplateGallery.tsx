import React from 'react';
import { STARTER_TEMPLATES, CarouselStarterTemplate } from '../../constants/starterTemplates';
import { Section } from '../../types';
import { useStore } from '../../store';
import { X, Sparkles } from 'lucide-react';
import { ThemeTokens, DARK_FALLBACK } from '../../constants/theme';
import { toast } from 'react-hot-toast';

interface TemplateGalleryProps {
    onClose: () => void;
    T?: ThemeTokens;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onClose, T: TProp }) => {
    const T = TProp || DARK_FALLBACK;
    const setSections = useStore(state => state.setSections);

    const applyTemplate = (template: CarouselStarterTemplate) => {
        const sections: Section[] = template.slides.map((slide, idx) => ({
            id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            title: slide.title || '',
            content: slide.content || '',
            alignment: slide.alignment || 'left',
            layoutType: slide.layoutType || 'storytelling',
            titleFont: slide.titleFont || 'druk',
            bodyFont: slide.bodyFont || 'montserrat',
            titleSize: slide.titleSize || 40,
            bodySize: slide.bodySize || 18,
            bgColor: slide.bgColor || '#000000',
            titleColor: slide.titleColor || '#ffffff',
            bodyColor: slide.bodyColor || '#cccccc',
            brandingColor: slide.brandingColor || '#ffffff',
            imagePosX: slide.imagePosX ?? 50,
            imagePosY: slide.imagePosY ?? 50,
            imageScale: slide.imageScale ?? 1,
            overlayOpacity: slide.overlayOpacity ?? 0.4,
            textPosY: slide.textPosY ?? 85,
            showSocialImage: slide.showSocialImage ?? false,
        }));

        setSections(sections);
        toast.success(`Template "${template.name}" aplicado!`);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-2xl mx-4 rounded-3xl overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}`, maxHeight: '85vh' }}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `1px solid ${T.border}` }}>
                    <div className="flex items-center gap-3">
                        <Sparkles size={20} style={{ color: T.accent }} />
                        <div>
                            <h2 className="text-lg font-black tracking-tight" style={{ color: T.text }}>Templates</h2>
                            <p className="text-[11px] font-medium" style={{ color: T.textSub }}>Escolha um modelo pra começar rápido</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl transition-all hover:scale-110 active:scale-90" style={{ background: T.bg, border: `1px solid ${T.border}` }}>
                        <X size={16} style={{ color: T.textSub }} />
                    </button>
                </div>

                {/* Grid */}
                <div className="p-6 overflow-y-auto no-scrollbar" style={{ maxHeight: 'calc(85vh - 80px)' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {STARTER_TEMPLATES.map(template => (
                            <button
                                key={template.id}
                                onClick={() => applyTemplate(template)}
                                className="text-left rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group relative overflow-hidden"
                                style={{ background: T.bg, border: `1px solid ${T.border}` }}
                            >
                                {/* Glow effect */}
                                <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-2xl" style={{ background: T.accent }} />

                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-2xl">{template.emoji}</span>
                                        <div>
                                            <h3 className="text-sm font-black tracking-tight" style={{ color: T.text }}>{template.name}</h3>
                                            <p className="text-[10px] font-medium" style={{ color: T.textFaint }}>{template.slideCount} slides</p>
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-medium leading-relaxed" style={{ color: T.textSub }}>{template.description}</p>

                                    {/* Preview colors */}
                                    <div className="flex gap-1 mt-3">
                                        {template.slides.slice(0, 4).map((slide, i) => (
                                            <div
                                                key={i}
                                                className="h-2 flex-1 rounded-full"
                                                style={{ background: slide.titleColor || '#ffffff', opacity: 0.6 }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
