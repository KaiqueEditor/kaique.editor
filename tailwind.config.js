/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: token('canvas'),
        bg: token('bg'),
        surface: token('surface'),
        'surface-2': token('surface-2'),
        raised: token('raised'),
        line: token('line'),
        'line-strong': token('line-strong'),
        fg: token('text'),
        'fg-2': token('text-2'),
        muted: token('muted'),
        faint: token('faint'),
        accent: token('accent'),
        'accent-hover': token('accent-hover'),
        'accent-text': token('accent-text'),
        'on-accent': token('on-accent'),
        danger: token('danger'),
        success: token('success'),
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        'ui-sm': 'var(--radius-sm)',
        'ui-md': 'var(--radius-md)',
        'ui-lg': 'var(--radius-lg)',
        'ui-xl': 'var(--radius-xl)',
        pill: '9999px',
      },
      // Escala tipográfica do Apple HIG (tamanho / entrelinha)
      fontSize: {
        caption2: ['11px', { lineHeight: '13px', letterSpacing: '0.006em' }],
        caption: ['12px', { lineHeight: '16px' }],
        footnote: ['13px', { lineHeight: '18px', letterSpacing: '-0.004em' }],
        subhead: ['15px', { lineHeight: '20px', letterSpacing: '-0.016em' }],
        body: ['17px', { lineHeight: '22px', letterSpacing: '-0.024em' }],
        title3: ['20px', { lineHeight: '25px', letterSpacing: '-0.022em' }],
        title2: ['22px', { lineHeight: '28px', letterSpacing: '-0.02em' }],
        title1: ['28px', { lineHeight: '34px', letterSpacing: '-0.016em' }],
        large: ['34px', { lineHeight: '41px', letterSpacing: '-0.012em' }],
      },
      height: {
        control: 'var(--control-h)',
        'control-lg': 'var(--control-h-lg)',
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
      },
    },
  },
  plugins: [],
}
