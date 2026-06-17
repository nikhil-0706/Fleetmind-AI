/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#1A2A4F', 50: '#E8EDF5', 100: '#D1DBEB', 200: '#A3B7D7', 300: '#7593C3', 400: '#476FAF', 500: '#1A2A4F', 600: '#14213F', 700: '#0E1830', 800: '#090F20', 900: '#040710' },
        secondary: { DEFAULT: '#2C3E70' },
        accent: { DEFAULT: '#F39C12' },
        background: { DEFAULT: '#F4F7FC' },
        surface: '#FFFFFF',
        border: '#E2E8F0',
        text: { DEFAULT: '#2C3E50', light: '#4A5568', dark: '#FFFFFF' },
      },
    },
  },
  plugins: [],
}