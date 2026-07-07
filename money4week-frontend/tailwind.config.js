/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Noto Serif"', 'serif'],
        sans: ['"Public Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          blue: '#094CB2',
          lightBlue: '#D9E2FF',
          bg: '#F5F3F4',
          text: '#434653',
          border: 'rgba(195, 198, 213, 0.15)',
        }
      }
    },
  },
  plugins: [],
}