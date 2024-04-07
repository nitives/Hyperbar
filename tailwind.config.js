/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        main: 'var(--accent-color)' // Using CSS variable for the theme color
      },
    },
  },
  plugins: [],
}