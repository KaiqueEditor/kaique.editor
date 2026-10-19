import React, { useState } from 'react';
import { Cloud, Download, Eye, FileText, LayoutGrid, SlidersHorizontal } from 'lucide-react';
import { Button, Dialog, cx } from '../../ui';

interface OnboardingProps {
    onComplete: () => void;
}

const STEPS: Array<{ icon: React.ReactNode; title: string; text: string }> = [
    {
        icon: <LayoutGrid size={26} />,
        title: 'Bem-vindo ao Carrossel.Pro',
        text: 'Carrosséis para o Instagram em minutos: você escreve, ajusta cada slide e exporta pronto para postar.',
    },
    {
        icon: <FileText size={26} />,
        title: 'Comece pelo roteiro',
        text: 'Em “Colar roteiro”, escreva no formato “texto 1”, “texto 2”… ou em parágrafos. Cada bloco vira um slide.',
    },
    {
        icon: <SlidersHorizontal size={26} />,
        title: 'Ajuste cada slide',
        text: 'Escolha o slide na faixa da esquerda e use o painel da direita: Texto, Imagem (com o ponto de foco) e Estilo.',
    },
    {
        icon: <Eye size={26} />,
        title: 'Veja como vai ficar no feed',
        text: '“Visualizar” mostra o carrossel como um post do Instagram, com o perfil, o deslizar e os pontinhos.',
    },
    {
        icon: <Download size={26} />,
        title: 'Exporte só o que precisa',
        text: 'Escolha os slides, o formato (imagens ou PDF) e a qualidade. Slides com vídeo saem como MP4.',
    },
    {
        icon: <Cloud size={26} />,
        title: 'Tudo salvo na nuvem',
        text: 'Salve com ⌘S ou pelo ícone. O status no topo avisa quando há alterações que ainda não foram salvas.',
    },
];

const DONE_KEY = 'carrosselpro-onboarding-done';

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
    const [step, setStep] = useState(0);
    const isLast = step === STEPS.length - 1;
    const current = STEPS[step];

    const finish = () => {
        try { localStorage.setItem(DONE_KEY, 'true'); } catch { /* armazenamento indisponível */ }
        onComplete();
    };

    return (
        <Dialog
            open
            onClose={finish}
            title={current.title}
            className="max-w-md"
            footer={
                <div className="w-full flex items-center justify-between gap-3">
                    <div className="flex gap-1.5" aria-label={`Passo ${step + 1} de ${STEPS.length}`}>
                        {STEPS.map((_, i) => (
                            <span key={i} aria-hidden="true"
                                className={cx('h-1.5 rounded-full transition-all duration-300', i === step ? 'w-5 bg-fg' : 'w-1.5 bg-fg/20')} />
                        ))}
                    </div>
                    <div className="flex gap-2">
                        {step > 0
                            ? <Button variant="ghost" onClick={() => setStep(s => s - 1)}>Voltar</Button>
                            : <Button variant="ghost" onClick={finish}>Pular</Button>}
                        <Button variant="primary" data-autofocus onClick={() => (isLast ? finish() : setStep(s => s + 1))}>
                            {isLast ? 'Começar' : 'Próximo'}
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="flex flex-col gap-5 -mt-1">
                <div className="w-16 h-16 rounded-ui-lg bg-fg/[0.07] flex items-center justify-center text-fg" aria-hidden="true">
                    {current.icon}
                </div>
                <p className="text-body text-fg-2 leading-relaxed">{current.text}</p>
            </div>
        </Dialog>
    );
};
