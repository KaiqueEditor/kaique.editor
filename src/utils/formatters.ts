import React from 'react';

/**
 * Renderiza texto formatado com marcadores:
 *   ==texto==  → destaque (highlight) colorido
 *   **texto**  → negrito forte
 *   *texto*    → negrito
 *   _texto_    → itálico
 *   ~texto~    → riscado (strikethrough)
 */
export const renderFormattedText = (text: string, highlightColor?: string) => {
  if (!text) return null;

  // Ordem: ==highlight==, **bold forte**, *bold*, _italic_, ~strike~
  const parts = text.split(/(==.*?==|\*\*.*?\*\*|\*.*?\*|_.*?_|~.*?~)/gs);

  return parts.map((part, i) => {
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
        part.slice(2, -2)
      );
    }

    // **negrito forte**
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return React.createElement(
        'strong',
        { key: i, className: 'font-black', style: { fontWeight: 900 } },
        part.slice(2, -2)
      );
    }

    // *negrito*
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return React.createElement(
        'strong',
        { key: i, style: { fontWeight: 700 } },
        part.slice(1, -1)
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

    return part;
  });
};
