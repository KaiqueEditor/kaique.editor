import React, { useState } from 'react';
import { ChevronRight, X } from 'lucide-react';

interface OnboardingProps {
    onComplete: () => void;
}

const STEPS = [
    {
        emoji: '👋',
        title: 'Bem-vindo ao CarrosselPro',
        description: 'A ferramenta que cria carrosséis profissionais para Instagram em poucos minutos.',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
        emoji: '🤖',
        title: 'Comece com o Agente IA',
        description: 'Cole seu texto no campo "Texto base" e clique em Gerar. O agente IA vai criar os slides automaticamente com títulos e conteúdo otimizados.',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
        emoji: '🎨',
        title: 'Estilize com Templates',
        description: 'Use os Templates prontos ou personalize cores, fontes e layout em cada slide. Salve seus temas favoritos para reutilizar.',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
    {
        emoji: '📸',
        title: 'Imagens com IA',
        description: 'No painel de cada slide, descreva a imagem que quer e clique no botão IA para gerar imagens únicas automaticamente.',
        gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    },
    {
        emoji: '📦',
        title: 'Exporte e Publique',
        description: 'Clique em Exportar ZIP para baixar os slides prontos para o Instagram. Também exporta PDF para apresentações.',
        gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    },
    {
        emoji: '☁️',
        title: 'Salve na Nuvem',
        description: 'Seus projetos ficam salvos automaticamente. Clique em Salvar para guardar na nuvem e acessar de qualquer dispositivo.',
        gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    },
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [step, setStep] = useState(0);
    const isLast = step === STEPS.length - 1;
    const current = STEPS[step];

    const handleNext = () => {
        if (isLast) {
            localStorage.setItem('carrosselpro-onboarding-done', 'true');
            onComplete();
        } else {
            setStep(s => s + 1);
        }
    };

    const handleSkip = () => {
        localStorage.setItem('carrosselpro-onboarding-done', 'true');
        onComplete();
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }}
        >
            <div
                className="w-full max-w-md mx-4 rounded-3xl overflow-hidden relative"
                style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)' }}
            >
                {/* Gradient top accent */}
                <div
                    className="h-2 w-full"
                    style={{ background: current.gradient }}
                />

                {/* Skip button */}
                <button
                    onClick={handleSkip}
                    className="absolute top-6 right-5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                    style={{ color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                    Pular
                </button>

                {/* Content */}
                <div className="px-8 pt-10 pb-8 text-center">
                    {/* Emoji with glow */}
                    <div className="relative inline-block mb-6">
                        <div
                            className="absolute inset-0 blur-2xl opacity-30 rounded-full"
                            style={{ background: current.gradient, transform: 'scale(2)' }}
                        />
                        <span className="text-6xl relative z-10 block">{current.emoji}</span>
                    </div>

                    <h2
                        className="text-xl font-black tracking-tight mb-4"
                        style={{ color: '#ffffff' }}
                    >
                        {current.title}
                    </h2>

                    <p
                        className="text-sm font-medium leading-relaxed mb-8 max-w-xs mx-auto"
                        style={{ color: 'rgba(255,255,255,0.6)' }}
                    >
                        {current.description}
                    </p>

                    {/* Step counter */}
                    <div
                        className="text-[10px] font-black uppercase tracking-widest mb-4"
                        style={{ color: 'rgba(255,255,255,0.2)' }}
                    >
                        {step + 1} / {STEPS.length}
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1 rounded-full mb-6 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div
                            className="h-full rounded-full transition-all duration-500 ease-out"
                            style={{
                                width: `${((step + 1) / STEPS.length) * 100}%`,
                                background: current.gradient,
                            }}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {step > 0 && (
                            <button
                                onClick={() => setStep(s => s - 1)}
                                className="flex-1 py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95"
                                style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    color: 'rgba(255,255,255,0.5)',
                                }}
                            >
                                Voltar
                            </button>
                        )}

                        <button
                            onClick={handleNext}
                            className="flex-1 py-3.5 rounded-xl text-sm font-black tracking-wide transition-all active:scale-95 hover:scale-[1.02] flex items-center justify-center gap-2"
                            style={{
                                background: current.gradient,
                                color: '#000000',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                            }}
                        >
                            {isLast ? '🚀 Começar!' : 'Próximo'}
                            {!isLast && <ChevronRight size={16} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
