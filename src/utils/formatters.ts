import React from 'react';

/**
 * Renderiza texto formatado com marcadores:
 *   ==texto==   → destaque (highlight) — usa cor do slide
 *   =1=texto=1= → vermelho (#ff0000)
 *   =2=texto=2= → amarelo/laranja (#FAA72B)
 *   =3=texto=3= → verde (#00ff33)
 *   =4=texto=4= → cyan (#00E5C3)
 *   =5=texto=5= → roxo/purple (#A855F7)
 *   =6=texto=6= → pink (#FF6B9D)
 *   =7=texto=7= → branco puro (#FFFFFF)
 *   =8=texto=8= → preto (#0F1419), para fundo claro
 *   =9=texto=9= → azul (#1D9BF0)
 *   **texto**   → negrito forte (900)
 *   *texto*     → negrito (700)
 *   _texto_     → itálico
 *   ~texto~     → riscado (strikethrough)
 *   ^texto^     → texto menor (0.65em, caps)
 *   {texto}     → gradiente animado
 */

export const COLOR_MAP: Record<string, string> = {
  '=1=': '#ff0000',    // Vermelho
  '=2=': '#FAA72B',    // Amarelo/Laranja
  '=3=': '#00ff33',    // Verde
  '=4=': '#00E5C3',    // Cyan
  '=5=': '#A855F7',    // Roxo/Purple
  '=6=': '#FF6B9D',    // Pink/Rosa
  '=7=': '#FFFFFF',    // Branco puro
  '=8=': '#0F1419',    // Preto (fundo claro)
  '=9=': '#1D9BF0',    // Azul
};

export const renderFormattedText = (text: string, highlightColor?: string) => {
  if (!text) return null;

  const parts = text.split(/(=1=.*?=1=|=2=.*?=2=|=3=.*?=3=|=4=.*?=4=|=5=.*?=5=|=6=.*?=6=|=7=.*?=7=|=8=.*?=8=|=9=.*?=9=|==.*?==|\*\*.*?\*\*|\*.*?\*|_.*?_|~.*?~|\^.*?\^|\{.*?\})/gs);

  return parts.map((part, i) => {
    // =N= color codes
    for (const [tag, color] of Object.entries(COLOR_MAP)) {
      if (part.startsWith(tag) && part.endsWith(tag) && part.length > tag.length * 2) {
        return React.createElement(
          'span',
          { key: i, style: { color, fontWeight: 900 } },
          renderFormattedText(part.slice(tag.length, -tag.length), highlightColor)
        );
      }
    }

    // ==destaque==
    if (part.startsWith('==') && part.endsWith('==') && part.length > 4) {
      return React.createElement(
        'span',
        {
          key: i,
          style: {
            color: highlightColor || '#00E5C3',
            fontWeight: 900,
          }
        },
        renderFormattedText(part.slice(2, -2), highlightColor)
      );
    }

    // **negrito forte**
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return React.createElement(
        'strong',
        { key: i, className: 'font-black', style: { fontWeight: 900 } },
        renderFormattedText(part.slice(2, -2), highlightColor)
      );
    }

    // *negrito*
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return React.createElement(
        'strong',
        { key: i, style: { fontWeight: 700 } },
        renderFormattedText(part.slice(1, -1), highlightColor)
      );
    }

    // _itálico_
    if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
      return React.createElement(
        'em',
        { key: i, style: { fontStyle: 'italic' } },
        part.slice(1, -1)
      );
    }

    // ~riscado~
    if (part.startsWith('~') && part.endsWith('~') && part.length > 2) {
      return React.createElement(
        'span',
        { key: i, style: { textDecoration: 'line-through', opacity: 0.6 } },
        part.slice(1, -1)
      );
    }

    // ^texto menor / caps^
    if (part.startsWith('^') && part.endsWith('^') && part.length > 2) {
      return React.createElement(
        'span',
        { key: i, style: { fontSize: '0.65em', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, opacity: 0.8 } },
        part.slice(1, -1)
      );
    }

    // {gradiente}
    if (part.startsWith('{') && part.endsWith('}') && part.length > 2) {
      return React.createElement(
        'span',
        {
          key: i,
          style: {
            fontWeight: 900,
            background: 'linear-gradient(90deg, #00E5C3, #A855F7, #FF6B9D)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }
        },
        part.slice(1, -1)
      );
    }

    return part;
  });
};

/** Tira as marcações de formatação (=1=…=1=, ==…==, *…*, _…_ etc.) para exibir só o texto. */
export const plainText = (text: string): string =>
  (text || '')
    .replace(/=\d=/g, '')
    .replace(/==/g, '')
    .replace(/\*\*|\*|~|\^|\{|\}/g, '')
    .replace(/(^|\s)_(\S)/g, '$1$2')
    .replace(/(\S)_(\s|$)/g, '$1$2')
    .replace(/\s+/g, ' ')
    .trim();
