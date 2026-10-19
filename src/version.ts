/**
 * Versão do app — altere aqui a cada deploy relevante.
 * Exibida sutilmente no rodapé da sidebar.
 *
 * Formato: MAJOR.MINOR.PATCH
 *  - MAJOR: mudanças de arquitetura / breaking changes
 *  - MINOR: features novas
 *  - PATCH: bugfixes e ajustes
 */
export const APP_VERSION = '3.0.0';

export const VERSION_NOTES: { version: string; date: string; changes: string[] }[] = [
  {
    version: '3.0.0',
    date: '2026-10-19',
    changes: [
      'Redesign completo: visual monocromático com vidro e detalhes do Instagram',
      'Tela inicial com projetos, editor novo no desktop e no celular',
      'Exportação com escolha de slides e qualidade; Visualizar como post do Instagram',
      'Painel admin novo com métricas calculadas no banco e auditoria de papéis',
      'Removida toda a IA da plataforma',
    ],
  },
  {
    version: '2.3.0',
    date: '2026-03-25',
    changes: [
      'Fix: Export MP4 agora usa Canvas + MediaRecorder (sem FFmpeg WASM)',
      'Fix: Botão "Sair" agora funciona corretamente com reload',
    ],
  },
  {
    version: '2.2.0',
    date: '2026-03-22',
    changes: [
      'Removido Remotion Player (código não utilizado)',
      'Removido export Reels (código não utilizado)',
      'Fix: thumbnails de projeto protegidas contra CORS (inlineImagesToDataUrl)',
      'Fix: removido auto-save duplicado (mantém apenas o hook useAutoSave)',
    ],
  },
  {
    version: '2.1.0',
    date: '2026-03-21',
    changes: [
      'Fix: imagens não desapareciam mais na exportação (inline data URLs antes do html-to-image)',
      'Fix: exportação PDF agora usa o mesmo pipeline protegido contra CORS',
      'Adicionado sistema de versionamento visível no app',
    ],
  },
  {
    version: '2.0.0',
    date: '2026-03-17',
    changes: [
      'Mega Redesign 2026 — layout 3 colunas desktop',
      'Mobile: BottomTabBar nativo',
      'Export multi-formato (Carousel, Stories, Feed, LinkedIn)',
      'FFmpeg WASM para composição de vídeo',
      'Auto-save + cloud sync via Supabase',
    ],
  },
];
