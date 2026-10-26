/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ivory: {
          DEFAULT: '#FDFBF7',
          surface: '#F4EFE6',
          container: '#EFE9DC',
          border: '#DDD5C7'
        },
        forest: {
          dark: '#1B4332',
          DEFAULT: '#1B4332',
          secondary: '#2D6A4F',
          light: '#40916C',
          mint: '#D8F3DC'
        },
        hazard: {
          DEFAULT: '#931A08',
          container: '#FBE8E5',
          text: '#6B1104'
        },
        contrast: {
          high: '#111613',
          medium: '#2E3A33',
          muted: '#536257'
        }
      }
    },
  },
  plugins: [],
}
