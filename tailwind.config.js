/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        ink: {
          50: '#fafaf7',
          100: '#f3f1ea',
          200: '#e5e1d4',
          800: '#2a2a2a',
          900: '#171717',
        },
        brand: {
          50: '#fef5f0',
          100: '#fde3d4',
          400: '#eb7a3a',
          500: '#dd5f1b',
          600: '#b84a12',
          700: '#8c380d',
        },
        sage: {
          100: '#e8ede6',
          400: '#86a380',
          600: '#4f6a4a',
        },
      },
    },
  },
  plugins: [],
};
