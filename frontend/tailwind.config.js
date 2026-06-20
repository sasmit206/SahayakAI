/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Inter Tight"', 'Inter', 'ui-sans-serif', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          950: '#08090c',
          900: '#0b0d12',
          850: '#0f1218',
          800: '#141821',
          700: '#1c2230',
          600: '#272f40',
          500: '#3a4458',
          400: '#5b6781',
          300: '#8893ad',
          200: '#b6becf',
          100: '#dfe3ec',
          50:  '#f3f5f9',
        },
        accent: {
          DEFAULT: '#5b8def',
          600: '#3f73e0',
          700: '#2f5cc0',
        },
        success: '#3fb27f',
        warning: '#d9a441',
        danger: '#d65a5a',
      },
      borderColor: { DEFAULT: 'rgba(255,255,255,0.06)' },
      boxShadow: {
        elev: '0 1px 0 rgba(255,255,255,0.04) inset, 0 1px 2px rgba(0,0,0,0.4)',
        card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
      },
      letterSpacing: { tightest: '-0.04em' },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: { 'fade-up': 'fade-up 0.6s ease-out both' },
    },
  },
  plugins: [],
};
