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

  // Ordem: =1=color1=1=, =2=color2=2=, =3=color3=3=, ==highlight==, **bold forte**, *bold*, _italic_, ~strike~
  const parts = text.split(/(=1=.*?=1=|=2=.*?=2=|=3=.*?=3=|==.*?==|\*\*.*?\*\*|\*.*?\*|_.*?_|~.*?~)/gs);

  return parts.map((part, i) => {
    // =1=destaque vermelho=1=  (#ff0000)
    if (part.startsWith('=1=') && part.endsWith('=1=') && part.length > 6) {
      return React.createElement(
        'span',
        {
          key: i,
          style: { color: '#ff0000', fontWeight: 900 }
        },
        part.slice(3, -3)
      );
    }

    // =2=destaque amarelo=2= (#FAA72B)
    if (part.startsWith('=2=') && part.endsWith('=2=') && part.length > 6) {
      return React.createElement(
        'span',
        {
          key: i,
          style: { color: '#FAA72B', fontWeight: 900 }
        },
        part.slice(3, -3)
      );
    }

    // =3=destaque verde=3= (#00ff33)
    if (part.startsWith('=3=') && part.endsWith('=3=') && part.length > 6) {
      return React.createElement(
        'span',
        {
          key: i,
          style: { color: '#00ff33', fontWeight: 900 }
        },
        part.slice(3, -3)
      );
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
