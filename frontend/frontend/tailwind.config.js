export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pokedex-red': '#7a1f1f',
        'deep-navy': '#0B1220',
        'panel-navy': '#111A2E',
        'pokedex-dark-2': '#111A2E',
        // Primary botanical accent
        'neon-green': '#6fbf86',
        // Softer border using primary accent
        'soft-border': 'rgba(111, 191, 134, 0.16)',
      },
      fontSize: {
        'pixel': ['0.75rem', { lineHeight: '1rem' }],
      },
      boxShadow: {
        // Global neon accents, softened ~20% for premium feel
        'neon': '0 0 6px rgba(111, 191, 134, 0.18), 0 0 12px rgba(111, 191, 134, 0.10)',
        'neon-strong': '0 0 14px rgba(111, 191, 134, 0.32), 0 0 24px rgba(111, 191, 134, 0.18)',
        // Epic selection halo
        'epic-halo': '0 0 0 1px rgba(255, 220, 120, 0.6), 0 0 18px rgba(255, 220, 120, 0.18)',
      },
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 6px rgba(111, 191, 134, 0.16)' },
          '50%': { boxShadow: '0 0 14px rgba(111, 191, 134, 0.35)' },
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
        'pokedex-grid': 'linear-gradient(0deg, transparent 24%, rgba(123, 211, 137, 0.02) 25%, rgba(123, 211, 137, 0.02) 26%, transparent 27%, transparent 74%, rgba(123, 211, 137, 0.02) 75%, rgba(123, 211, 137, 0.02) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(123, 211, 137, 0.02) 25%, rgba(123, 211, 137, 0.02) 26%, transparent 27%, transparent 74%, rgba(123, 211, 137, 0.02) 75%, rgba(123, 211, 137, 0.02) 76%, transparent 77%, transparent)',
      },
    },
  },
  plugins: [],
}

