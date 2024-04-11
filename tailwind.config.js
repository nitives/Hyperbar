/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        main: 'var(--accent-color)', // Using CSS variable for the theme color
      },
      spacing: {
        'xs': '0.235em /* 3.76px */',
        's': '0.345em /* 5.52px */',
        'm': '0.785em /* 12.56px */',
        'l': '1em /* 16px */',
        'xl': '1.615em /* 25.84px */',
        'xxl': '2.615em /* 41.84px */',
      }
    },
  },
  plugins: [],
}