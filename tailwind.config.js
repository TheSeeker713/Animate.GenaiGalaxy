/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        studio: {
          bg: 'var(--studio-bg)',
          panel: 'var(--studio-panel)',
          surface: 'var(--studio-surface)',
          border: 'var(--studio-border)',
          text: 'var(--studio-text)',
          muted: 'var(--studio-muted)',
          accent: 'var(--studio-accent)',
          danger: 'var(--studio-danger)',
        },
        suite: {
          raster: '#22d3ee',
          vector: '#4ade80',
          character: '#c084fc',
          story: '#f472b6',
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Segoe UI', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        studio: 'var(--studio-shadow)',
      },
    },
  },
  plugins: [],
}
