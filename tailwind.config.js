/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
      },
      colors: {
        ink: {
          50:  '#fafaf7',
          100: '#f3f1ea',
          200: '#e5e1d4',
          300: '#a8a296',
          500: '#6b675e',
          700: '#3a3833',
          800: '#2a2a2a',
          900: '#171717',
        },
        stage: '#1d1b18',
        brand: {
          50:  '#fef5f0',
          100: '#fde3d4',
          400: '#eb7a3a',
          500: '#dd5f1b',
          600: '#b84a12',
          700: '#8c380d',
        },
        sage: {
          100: '#e8ede6',
          300: '#b9cdb4',
          400: '#86a380',
          600: '#4f6a4a',
          700: '#3d5539',
        },
        ok: {
          DEFAULT: '#4f6a4a',          // sage-600 alias
          dark: '#9cc294',             // ok on stage
          fillDark: '#5f8558',
        },
        bad: {
          DEFAULT: '#c8402f',
          dark: '#f08a6c',
        },
        near: '#d8d27a',
      },
      boxShadow: {
        tile: '0 14px 30px rgba(23,23,23,0.12)',
      },
      maxWidth: {
        container: '1120px',
      },
    },
  },
  plugins: [],
};
