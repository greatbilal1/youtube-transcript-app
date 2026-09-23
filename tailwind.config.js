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
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(99,102,241,0.15), 0 8px 40px -12px rgba(99,102,241,0.45)',
        'glow-lg': '0 0 0 1px rgba(99,102,241,0.2), 0 20px 60px -12px rgba(99,102,241,0.55)',
        'glow-primary': '0 8px 30px -8px rgba(99,102,241,0.8)',
      },
      backgroundImage: {
        'gradient-brand':
          'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #22d3ee 100%)',
      },
      // The ambient blobs animate via the `blob` keyframes declared in
      // index.css, because they set `animation:` inline.
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [],
};
