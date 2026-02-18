export interface FontOption {
  id: string;
  name: string;
  stack: string;
  googleFont?: string;
}

export const FONT_OPTIONS: FontOption[] = [
  { id: 'sans', name: 'Inter', stack: "'Inter', sans-serif", googleFont: 'Inter:wght@300;400;500;600;700;800;900' },
  { id: 'roboto', name: 'Roboto', stack: "'Roboto', sans-serif", googleFont: 'Roboto:wght@400;500;700' },
  { id: 'opensans', name: 'Open Sans', stack: "'Open Sans', sans-serif", googleFont: 'Open+Sans:wght@400;700' },
  { id: 'lato', name: 'Lato', stack: "'Lato', sans-serif", googleFont: 'Lato:wght@400;700' },
  { id: 'montserrat', name: 'Montserrat', stack: "'Montserrat', sans-serif", googleFont: 'Montserrat:wght@400;700;900' },
  { id: 'poppins', name: 'Poppins', stack: "'Poppins', sans-serif", googleFont: 'Poppins:wght@400;600;700' },
  { id: 'sourcesans', name: 'Source Sans 3', stack: "'Source Sans 3', sans-serif", googleFont: 'Source+Sans+3:wght@400;700' },
  { id: 'nunito', name: 'Nunito', stack: "'Nunito', sans-serif", googleFont: 'Nunito:wght@400;700' },
  { id: 'raleway', name: 'Raleway', stack: "'Raleway', sans-serif", googleFont: 'Raleway:wght@400;700' },
  { id: 'merriweather', name: 'Merriweather', stack: "'Merriweather', serif", googleFont: 'Merriweather:wght@400;700' },
  { id: 'serif', name: 'Playfair Display', stack: "'Playfair Display', serif", googleFont: 'Playfair+Display:ital,wght@0,400;0,700;1,400' },
  { id: 'lora', name: 'Lora', stack: "'Lora', serif", googleFont: 'Lora:ital,wght@0,400;0,700;1,400' },
  { id: 'jetbrains', name: 'JetBrains Mono', stack: "'JetBrains Mono', monospace", googleFont: 'JetBrains+Mono:wght@400;700' },
  { id: 'firacode', name: 'Fira Code', stack: "'Fira Code', monospace", googleFont: 'Fira+Code:wght@400;700' },
  { id: 'anton', name: 'Anton (Impacto)', stack: "'Anton', sans-serif", googleFont: 'Anton' },
  { id: 'wide', name: 'Unbounded (Wide)', stack: "'Unbounded', sans-serif", googleFont: 'Unbounded:wght@400;700;900' },
  { id: 'druk', name: 'Druk Wide (Simulação)', stack: "'Unbounded', 'Anton', sans-serif", googleFont: 'Unbounded:wght@900|Anton' },
];

export const getFontFamily = (fontKey?: string): string => {
  const font = FONT_OPTIONS.find(f => f.id === fontKey);
  return font ? font.stack : "'Inter', sans-serif";
};
