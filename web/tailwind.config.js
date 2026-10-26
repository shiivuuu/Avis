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
        ivory: {
          DEFAULT: '#F7F5EE',
          light: '#FBF9F4',
          surface: '#EFECE2',
          border: '#DDD8CB'
        },
        forest: {
          DEFAULT: '#204C3A',
          dark: '#163A2C',
          light: '#2E6950',
          accent: '#3B8264',
          sage: '#A8B9A0',
          paleSage: '#E9EFE5'
        },
        contrast: {
          primary: '#202821',
          secondary: '#535E56',
          muted: '#717D74',
          high: '#0D130E'
        },
        status: {
          error: '#A62C2C',
          errorBg: '#FDF1F1',
          warning: '#855A0B',
          warningBg: '#FFF9E6',
          success: '#1B5E20',
          successBg: '#E8F5E9'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      fontSize: {
        'fluid-h1': 'clamp(1.75rem, 4vw, 2.75rem)',
        'fluid-h2': 'clamp(1.35rem, 3vw, 2rem)',
        'fluid-body': 'clamp(1rem, 1.5vw, 1.15rem)',
      },
      boxShadow: {
        'subtle': '0 2px 8px -2px rgba(32, 76, 58, 0.06), 0 1px 4px -1px rgba(32, 76, 58, 0.04)',
        'card': '0 4px 16px -4px rgba(32, 76, 58, 0.08), 0 2px 6px -2px rgba(32, 76, 58, 0.04)',
        'elevated': '0 12px 32px -8px rgba(32, 76, 58, 0.12), 0 4px 12px -2px rgba(32, 76, 58, 0.06)'
      }
    },
  },
  plugins: [],
}
