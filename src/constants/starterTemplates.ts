import { Section } from '../types';

export interface CarouselStarterTemplate {
    id: string;
    name: string;
    description: string;
    emoji: string;
    category: 'feed' | 'twitter' | 'educacao';
    slideCount: number;
    slides: Partial<Section>[];
}

const base = (overrides: Partial<Section>): Partial<Section> => ({
    alignment: 'left',
    layoutType: 'storytelling',
    titleFont: 'bebas-neue',
    bodyFont: 'sans',
    titleSize: 40,
    bodySize: 18,
    bgColor: '#000000',
    titleColor: '#ffffff',
    bodyColor: '#cccccc',
    brandingColor: '#ffffff',
    imagePosX: 50,
    imagePosY: 50,
    imageScale: 1,
    overlayOpacity: 0,
    textPosY: 85,
    showSocialImage: false,
    ...overrides,
});

export const STARTER_TEMPLATES: CarouselStarterTemplate[] = [
    {
        id: 'tips-dark',
        name: 'Dicas Pro',
        description: '5 dicas com estilo dark premium',
        emoji: '💡',
        category: 'feed',
        slideCount: 5,
        slides: [
            base({ title: '5 DICAS\nQUE VÃO MUDAR\nSEU JOGO', content: 'Salve para não esquecer →', titleSize: 48, titleFont: 'bebas-neue', bodyFont: 'sans' }),
            base({ title: 'DICA 01', content: 'Comece pelo mais difícil.\nSeu cérebro está mais afiado pela manhã.', titleColor: '#F5A623' }),
            base({ title: 'DICA 02', content: 'Consistência > Perfeição.\nPostar 3x/semana é melhor que 1 post perfeito.', titleColor: '#F5A623' }),
            base({ title: 'DICA 03', content: 'Estude seus concorrentes.\nVeja o que funciona e adapte pro seu estilo.', titleColor: '#F5A623' }),
            base({ title: 'GOSTOU?\nSALVE ESSE POST', content: 'E compartilhe com alguém que precisa ouvir isso!', titleSize: 44, alignment: 'center' }),
        ],
    },
    {
        id: 'before-after',
        name: 'Antes & Depois',
        description: 'Transformação com contraste visual',
        emoji: '🔄',
        category: 'feed',
        slideCount: 4,
        slides: [
            base({ title: 'ANTES\nvs\nDEPOIS', content: 'A transformação completa →', titleSize: 52, titleFont: 'bebas-neue', alignment: 'center' }),
            base({ title: 'ANTES', content: 'O problema que existia antes:\n• Desorganizado\n• Sem estratégia\n• Resultados ruins', titleColor: '#ef4444', bgColor: '#1a0000' }),
            base({ title: 'DEPOIS', content: 'O resultado após a mudança:\n• Organizado\n• Processo claro\n• ROI 3x maior', titleColor: '#22c55e', bgColor: '#001a00' }),
            base({ title: 'QUER ESSA\nTRANSFORMAÇÃO?', content: 'Link na bio para começar hoje!', titleSize: 44, alignment: 'center', titleColor: '#F5A623' }),
        ],
    },
    {
        id: 'storytelling',
        name: 'Storytelling',
        description: 'Narrativa envolvente em 6 slides',
        emoji: '📖',
        category: 'feed',
        slideCount: 6,
        slides: [
            base({ title: 'UMA HISTÓRIA\nQUE MUDOU\nMINHA VIDA', content: 'Leia até o final...', titleSize: 44, titleFont: 'playfair', bodyFont: 'lato' }),
            base({ title: 'TUDO COMEÇOU\nEM 2020', content: 'Eu não sabia o que estava fazendo. Zero experiência, zero resultados.', titleFont: 'playfair', bodyFont: 'lato', titleSize: 32 }),
            base({ title: 'O PONTO\nDE VIRADA', content: 'Encontrei um mentor que me mostrou o caminho. Investi tudo que tinha.', titleFont: 'playfair', bodyFont: 'lato', titleSize: 32, titleColor: '#F5A623' }),
            base({ title: 'A PRIMEIRA\nVITÓRIA', content: 'Em 90 dias, os resultados começaram a aparecer. Era real.', titleFont: 'playfair', bodyFont: 'lato', titleSize: 32 }),
            base({ title: 'HOJE,\n3 ANOS DEPOIS', content: 'Faturamento 6 dígitos. Equipe de 5 pessoas. Liberdade.', titleFont: 'playfair', bodyFont: 'lato', titleSize: 32, titleColor: '#22c55e' }),
            base({ title: 'E VOCÊ?', content: 'Qual decisão vai tomar hoje?\n\nComente "EU" e eu te ajudo.', titleFont: 'playfair', bodyFont: 'lato', titleSize: 44, alignment: 'center' }),
        ],
    },
    {
        id: 'listicle',
        name: 'Lista Numerada',
        description: 'Lista clean com números grandes',
        emoji: '📋',
        category: 'feed',
        slideCount: 5,
        slides: [
            base({ title: '7 ERROS QUE\nTODO INICIANTE\nCOMETE', content: 'E como evitar cada um →', titleSize: 44, titleFont: 'bebas-neue', bodyFont: 'sans', alignment: 'center' }),
            base({ title: '01', content: 'Não definir um nicho.\nTentar falar com todo mundo é falar com ninguém.', titleSize: 80, titleColor: '#F5A623', titleFont: 'bebas-neue', bodyFont: 'sans' }),
            base({ title: '02', content: 'Focar em likes ao invés de leads.\nVaidade não paga boleto.', titleSize: 80, titleColor: '#F5A623', titleFont: 'bebas-neue', bodyFont: 'sans' }),
            base({ title: '03', content: 'Copiar conteúdo ao invés de adaptar.\nSua audiência percebe.', titleSize: 80, titleColor: '#F5A623', titleFont: 'bebas-neue', bodyFont: 'sans' }),
            base({ title: 'EVITE ESSES\nERROS', content: 'Salve e compartilhe com alguém que precisa!', titleSize: 44, titleFont: 'bebas-neue', bodyFont: 'sans', alignment: 'center' }),
        ],
    },
    {
        id: 'educational',
        name: 'Educacional',
        description: 'Conteúdo didático e clean',
        emoji: '🎓',
        category: 'educacao',
        slideCount: 5,
        slides: [
            base({ title: 'COMO CRIAR\nCONTEÚDO\nQUE VENDE', content: 'O guia definitivo →', titleSize: 44, titleFont: 'plus-jakarta', bodyFont: 'sans', bgColor: '#0a0a1a', titleColor: '#a78bfa' }),
            base({ title: 'PASSO 1', content: 'Entenda a dor do seu público.\nFaça pesquisas, leia comentários, ouça.', titleFont: 'plus-jakarta', bodyFont: 'sans', bgColor: '#0a0a1a', titleColor: '#a78bfa', titleSize: 28 }),
            base({ title: 'PASSO 2', content: 'Estruture com framework AIDA:\n\n• Atenção\n• Interesse\n• Desejo\n• Ação', titleFont: 'plus-jakarta', bodyFont: 'sans', bgColor: '#0a0a1a', titleColor: '#a78bfa', titleSize: 28 }),
            base({ title: 'PASSO 3', content: 'Use CTAs claros.\nDiga exatamente o que você quer que a pessoa faça.', titleFont: 'plus-jakarta', bodyFont: 'sans', bgColor: '#0a0a1a', titleColor: '#a78bfa', titleSize: 28 }),
            base({ title: 'APLIQUE\nAGORA!', content: 'Salve esse post e crie seu próximo conteúdo usando essa estrutura.', titleFont: 'plus-jakarta', bodyFont: 'sans', bgColor: '#0a0a1a', titleColor: '#a78bfa', titleSize: 44, alignment: 'center' }),
        ],
    },
    {
        id: 'social-thread',
        name: 'Thread Social',
        description: 'Estilo Twitter/X — texto clean e impactante',
        emoji: '𝕏',
        category: 'twitter',
        slideCount: 5,
        slides: [
            { layoutType: 'social-post', title: 'Se você está na casa dos 30, você tem em média 46 anos restantes de vida.', content: 'Já viveu 39% do seu tempo de vida na Terra.\n\nTem somente 2.392 finais de semana restantes e 16 mil dias para viver.\n\nTrabalhe, economize e invista, mas também aproveite a vida — ela passa rápido demais.', bgColor: '#ffffff', titleColor: '#0f1419', bodyColor: '#0f1419', brandingColor: '#0f1419', alignment: 'left', titleFont: 'sans', bodyFont: 'sans', titleSize: 26, bodySize: 24, showSocialImage: false, imagePosX: 50, imagePosY: 50, imageScale: 1, overlayOpacity: 0, textPosY: 85 } as any,
            { layoutType: 'social-post', title: 'A maioria das pessoas passa a vida inteira sem perceber isso:', content: 'Você não precisa de mais informação.\n\nVocê precisa de mais ação.\n\n90% do que você precisa saber, você já sabe. O que falta é coragem para executar.', bgColor: '#ffffff', titleColor: '#0f1419', bodyColor: '#0f1419', brandingColor: '#0f1419', alignment: 'left', titleFont: 'sans', bodyFont: 'sans', titleSize: 26, bodySize: 24, showSocialImage: false, imagePosX: 50, imagePosY: 50, imageScale: 1, overlayOpacity: 0, textPosY: 85 } as any,
            { layoutType: 'social-post', title: '3 verdades que ninguém te conta sobre dinheiro:', content: '1. Renda alta não significa riqueza. É o que você guarda que importa.\n\n2. Investir R$500/mês com consistência vale mais que R$10 mil uma vez por ano.\n\n3. A melhor hora para começar foi ontem. A segunda melhor é agora.', bgColor: '#ffffff', titleColor: '#0f1419', bodyColor: '#0f1419', brandingColor: '#0f1419', alignment: 'left', titleFont: 'sans', bodyFont: 'sans', titleSize: 26, bodySize: 24, showSocialImage: false, imagePosX: 50, imagePosY: 50, imageScale: 1, overlayOpacity: 0, textPosY: 85 } as any,
            { layoutType: 'social-post', title: 'O que eu faria se tivesse que recomeçar do zero hoje:', content: '→ Escolheria 1 habilidade\n→ Estudaria 2h por dia\n→ Criaria conteúdo sobre o processo\n→ Monetizaria em 90 dias\n\nSimples? Sim. Fácil? Não. Possível? Com certeza.', bgColor: '#ffffff', titleColor: '#0f1419', bodyColor: '#0f1419', brandingColor: '#0f1419', alignment: 'left', titleFont: 'sans', bodyFont: 'sans', titleSize: 26, bodySize: 24, showSocialImage: false, imagePosX: 50, imagePosY: 50, imageScale: 1, overlayOpacity: 0, textPosY: 85 } as any,
            { layoutType: 'social-post', title: 'Se esse conteúdo fez sentido pra você:', content: 'Salva esse post.\n\nManda pra alguém que precisa ouvir isso.\n\nE comenta: qual dessas verdades mais te impactou? 👇', bgColor: '#ffffff', titleColor: '#0f1419', bodyColor: '#0f1419', brandingColor: '#0f1419', alignment: 'left', titleFont: 'sans', bodyFont: 'sans', titleSize: 26, bodySize: 24, showSocialImage: false, imagePosX: 50, imagePosY: 50, imageScale: 1, overlayOpacity: 0, textPosY: 85 } as any,
        ],
    },
    {
        id: 'social-dark',
        name: 'Thread Dark',
        description: 'Twitter/X modo escuro — clean e elegante',
        emoji: '🌙',
        category: 'twitter',
        slideCount: 5,
        slides: [
            { layoutType: 'social-post', title: 'A regra dos 5 segundos que mudou minha produtividade:', content: 'Quando você pensa em fazer algo, tem 5 segundos para agir.\n\nDepois disso, seu cérebro vai encontrar uma desculpa para não fazer.\n\n5, 4, 3, 2, 1 — vai.', bgColor: '#15202b', titleColor: '#e7e9ea', bodyColor: '#e7e9ea', brandingColor: '#e7e9ea', alignment: 'left', titleFont: 'sans', bodyFont: 'sans', titleSize: 26, bodySize: 24, showSocialImage: false, imagePosX: 50, imagePosY: 50, imageScale: 1, overlayOpacity: 0, textPosY: 85 } as any,
            { layoutType: 'social-post', title: 'Pare de se comparar com quem está no capítulo 20.', content: 'Você está no capítulo 3.\n\nA jornada é sua. O ritmo é seu.\n\nO importante é não parar de virar as páginas.', bgColor: '#15202b', titleColor: '#e7e9ea', bodyColor: '#e7e9ea', brandingColor: '#e7e9ea', alignment: 'left', titleFont: 'sans', bodyFont: 'sans', titleSize: 26, bodySize: 24, showSocialImage: false, imagePosX: 50, imagePosY: 50, imageScale: 1, overlayOpacity: 0, textPosY: 85 } as any,
            { layoutType: 'social-post', title: 'Hábitos que mudaram minha vida nos últimos 12 meses:', content: '• Acordar às 5h30\n• 30 min de leitura diária\n• Sem celular na primeira hora\n• Exercício 4x por semana\n• Journaling antes de dormir\n\nParece básico. Mas o básico funciona.', bgColor: '#15202b', titleColor: '#e7e9ea', bodyColor: '#e7e9ea', brandingColor: '#e7e9ea', alignment: 'left', titleFont: 'sans', bodyFont: 'sans', titleSize: 26, bodySize: 24, showSocialImage: false, imagePosX: 50, imagePosY: 50, imageScale: 1, overlayOpacity: 0, textPosY: 85 } as any,
            { layoutType: 'social-post', title: 'O melhor investimento que você pode fazer:', content: 'Não é crypto.\nNão é imóvel.\nNão é ações.\n\nÉ em você mesmo.\n\nConhecimento + execução = resultados que ninguém pode tirar de você.', bgColor: '#15202b', titleColor: '#e7e9ea', bodyColor: '#e7e9ea', brandingColor: '#e7e9ea', alignment: 'left', titleFont: 'sans', bodyFont: 'sans', titleSize: 26, bodySize: 24, showSocialImage: false, imagePosX: 50, imagePosY: 50, imageScale: 1, overlayOpacity: 0, textPosY: 85 } as any,
            { layoutType: 'social-post', title: 'Se esse conteúdo te ajudou:', content: 'Salva pra reler quando precisar.\n\nCompartilha com quem precisa de um empurrão.\n\nE segue pra mais reflexões como essa. ✊', bgColor: '#15202b', titleColor: '#e7e9ea', bodyColor: '#e7e9ea', brandingColor: '#e7e9ea', alignment: 'left', titleFont: 'sans', bodyFont: 'sans', titleSize: 26, bodySize: 24, showSocialImage: false, imagePosX: 50, imagePosY: 50, imageScale: 1, overlayOpacity: 0, textPosY: 85 } as any,
        ],
    },
    {
        id: 'x-opiniao',
        name: 'Opinião no X',
        description: 'Frases fortes com palavras em destaque',
        emoji: '💬',
        category: 'twitter',
        slideCount: 5,
        slides: [
            { layoutType: 'social-post', title: 'Sem **marketing**, ninguém vê você.', content: '', bgColor: '#ffffff', titleColor: '#0f1419', bodyColor: '#0f1419', brandingColor: '#0f1419', alignment: 'left', titleFont: 'sans', bodyFont: 'sans', showSocialImage: false, imagePosX: 50, imagePosY: 50, imageScale: 1, overlayOpacity: 0, textPosY: 85, titleSize: 40, bodySize: 26, postTitleBold: false } as any,
            { layoutType: 'social-post', title: 'Produto bom **não se vende sozinho**.', content: 'Se ninguém sabe que ele existe, ele não existe.', bgColor: '#ffffff', titleColor: '#0f1419', bodyColor: '#0f1419', brandingColor: '#0f1419', alignment: 'left', titleFont: 'sans', bodyFont: 'sans', showSocialImage: false, imagePosX: 50, imagePosY: 50, imageScale: 1, overlayOpacity: 0, textPosY: 85, titleSize: 40, bodySize: 26, postTitleBold: false } as any,
            { layoutType: 'social-post', title: 'Quem **aparece todo dia** é lembrado.', content: 'Quem aparece quando dá é esquecido.', bgColor: '#ffffff', titleColor: '#0f1419', bodyColor: '#0f1419', brandingColor: '#0f1419', alignment: 'left', titleFont: 'sans', bodyFont: 'sans', showSocialImage: false, imagePosX: 50, imagePosY: 50, imageScale: 1, overlayOpacity: 0, textPosY: 85, titleSize: 40, bodySize: 26, postTitleBold: false } as any,
            { layoutType: 'social-post', title: 'Você não precisa de mais seguidores.', content: 'Precisa de **seguidores certos**.', bgColor: '#ffffff', titleColor: '#0f1419', bodyColor: '#0f1419', brandingColor: '#0f1419', alignment: 'left', titleFont: 'sans', bodyFont: 'sans', showSocialImage: false, imagePosX: 50, imagePosY: 50, imageScale: 1, overlayOpacity: 0, textPosY: 85, titleSize: 40, bodySize: 26, postTitleBold: false } as any,
            { layoutType: 'social-post', title: 'Salva esse post.', content: 'E manda pra quem ainda acha que marketing é **opcional**.', bgColor: '#ffffff', titleColor: '#0f1419', bodyColor: '#0f1419', brandingColor: '#0f1419', alignment: 'left', titleFont: 'sans', bodyFont: 'sans', showSocialImage: false, imagePosX: 50, imagePosY: 50, imageScale: 1, overlayOpacity: 0, textPosY: 85, titleSize: 40, bodySize: 26, postTitleBold: false } as any,
        ],
    },
    {
        id: 'x-lista-preto',
        name: 'Lista no X (preto)',
        description: 'Thread numerada no modo escuro',
        emoji: '🧵',
        category: 'twitter',
        slideCount: 5,
        slides: [
            { layoutType: 'social-post', title: '5 hábitos de quem cresce no Instagram', content: 'Uma thread curta 🧵', bgColor: '#000000', titleColor: '#e7e9ea', bodyColor: '#e7e9ea', brandingColor: '#e7e9ea', alignment: 'left', titleFont: 'sans', bodyFont: 'sans', showSocialImage: false, imagePosX: 50, imagePosY: 50, imageScale: 1, overlayOpacity: 0, textPosY: 85, titleSize: 30, bodySize: 24 } as any,
            { layoutType: 'social-post', title: '1. Posta no mesmo horário', content: 'O público aprende quando você aparece.', bgColor: '#000000', titleColor: '#e7e9ea', bodyColor: '#e7e9ea', brandingColor: '#e7e9ea', alignment: 'left', titleFont: 'sans', bodyFont: 'sans', showSocialImage: false, imagePosX: 50, imagePosY: 50, imageScale: 1, overlayOpacity: 0, textPosY: 85, titleSize: 30, bodySize: 24 } as any,
            { layoutType: 'social-post', title: '2. Responde todo comentário', content: 'Conversa é o que o algoritmo mais entrega.', bgColor: '#000000', titleColor: '#e7e9ea', bodyColor: '#e7e9ea', brandingColor: '#e7e9ea', alignment: 'left', titleFont: 'sans', bodyFont: 'sans', showSocialImage: false, imagePosX: 50, imagePosY: 50, imageScale: 1, overlayOpacity: 0, textPosY: 85, titleSize: 30, bodySize: 24 } as any,
            { layoutType: 'social-post', title: '3. Reaproveita o que deu certo', content: 'Um bom carrossel vira Reels, Stories e thread.', bgColor: '#000000', titleColor: '#e7e9ea', bodyColor: '#e7e9ea', brandingColor: '#e7e9ea', alignment: 'left', titleFont: 'sans', bodyFont: 'sans', showSocialImage: false, imagePosX: 50, imagePosY: 50, imageScale: 1, overlayOpacity: 0, textPosY: 85, titleSize: 30, bodySize: 24 } as any,
            { layoutType: 'social-post', title: '4. Mede, não chuta', content: 'Salvamentos e compartilhamentos valem mais que curtidas.', bgColor: '#000000', titleColor: '#e7e9ea', bodyColor: '#e7e9ea', brandingColor: '#e7e9ea', alignment: 'left', titleFont: 'sans', bodyFont: 'sans', showSocialImage: false, imagePosX: 50, imagePosY: 50, imageScale: 1, overlayOpacity: 0, textPosY: 85, titleSize: 30, bodySize: 24 } as any,
        ],
    },
];
