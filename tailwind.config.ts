/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ink: '#14213D',
        surface: '#1F2E4D',
        paper: '#F7F4EE',
        sand: '#EDE7DB',
        teal: { DEFAULT: '#1F7A6D', hover: '#186559', light: '#3FBFAE' },
        coral: { DEFAULT: '#D1495B', hover: '#B83A4B', light: '#F2A0AB', soft: '#F3D7DB' },
        amber: { DEFAULT: '#E9A23B', soft: '#F7E8CF' },
        body: '#1B1F2A',
        muted: '#5B6475',
        line: '#D8D2C4',
        // Dark-surface accessibility tokens (WCAG AA on ink/surface):
        // mist = secondary text · steel = icons/placeholders · lineDark = borders
        mist: '#B4BCCB',
        steel: '#9AA5BC',
        lineDark: '#6B7BA6',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(20,33,61,.06), 0 8px 24px rgba(20,33,61,.08)',
        lift: '0 2px 4px rgba(20,33,61,.08), 0 12px 32px rgba(20,33,61,.12)',
        insetline: 'inset 0 0 0 1px rgba(216,210,196,.6)',
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(1)', opacity: '0.7' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '20%,60%': { transform: 'translateX(-8px)' },
          '40%,80%': { transform: 'translateX(8px)' },
        },
      },
      animation: {
        pulseRing: 'pulseRing 1.2s ease-out infinite',
        shake: 'shake .4s ease-in-out',
      },
    },
  },
  plugins: [],
};
