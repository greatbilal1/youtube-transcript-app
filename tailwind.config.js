/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        glow: {
          indigo: 'rgba(99, 102, 241, 0.35)',
          violet: 'rgba(139, 92, 246, 0.3)',
          cyan: 'rgba(34, 211, 238, 0.25)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(99,102,241,0.15), 0 8px 40px -12px rgba(99,102,241,0.45)',
        'glow-lg': '0 0 0 1px rgba(99,102,241,0.2), 0 20px 60px -12px rgba(99,102,241,0.55)',
        'glow-primary': '0 8px 30px -8px rgba(99,102,241,0.8)',
        glass: '0 8px 32px -12px rgba(0,0,0,0.15)',
        'glass-dark': '0 8px 32px -12px rgba(0,0,0,0.6)',
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundImage: {
        'gradient-brand':
          'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #22d3ee 100%)',
        'gradient-brand-soft':
          'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.12), rgba(34,211,238,0.12))',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -40px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        blob: 'blob 12s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'gradient-x': 'gradient-x 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
