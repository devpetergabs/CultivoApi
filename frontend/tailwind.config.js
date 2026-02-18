export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pokedex-red': '#E23A3A',
        'deep-navy': '#0B1220',
        'panel-navy': '#111A2E',
        'neon-green': '#9BEF00',
        'soft-border': 'rgba(155, 239, 0, 0.12)',
      },
      fontSize: {
        'pixel': ['0.75rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        'neon': '0 0 10px rgba(155, 239, 0, 0.3), 0 0 20px rgba(155, 239, 0, 0.15)',
        'neon-strong': '0 0 20px rgba(155, 239, 0, 0.6), 0 0 40px rgba(155, 239, 0, 0.3)',
      },
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(155, 239, 0, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(155, 239, 0, 0.8)' },
        },
        'slide-in-right': {
          'from': { transform: 'translateX(100%)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-out-right': {
          'from': { transform: 'translateX(0)', opacity: '1' },
          'to': { transform: 'translateX(100%)', opacity: '0' },
        },
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'slide-out-right': 'slide-out-right 0.3s ease-in',
      },
      backgroundImage: {
        'pokedex-grid': 'linear-gradient(0deg, transparent 24%, rgba(155, 239, 0, 0.03) 25%, rgba(155, 239, 0, 0.03) 26%, transparent 27%, transparent 74%, rgba(155, 239, 0, 0.03) 75%, rgba(155, 239, 0, 0.03) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(155, 239, 0, 0.03) 25%, rgba(155, 239, 0, 0.03) 26%, transparent 27%, transparent 74%, rgba(155, 239, 0, 0.03) 75%, rgba(155, 239, 0, 0.03) 76%, transparent 77%, transparent)',
      },
    },
  },
  plugins: [],
}

