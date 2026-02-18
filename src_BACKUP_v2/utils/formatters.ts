import React from 'react';

export const renderFormattedText = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/gs);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return React.createElement(
        'strong',
        { key: i, className: 'font-black', style: { opacity: 1, fontWeight: 900 } },
        part.slice(2, -2)
      );
    }
    return part;
  });
};
