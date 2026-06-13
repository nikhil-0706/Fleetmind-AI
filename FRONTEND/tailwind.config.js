/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1A2A4F', // Deep Navy
          50: '#E8EDF5',
          100: '#D1DBEB',
          200: '#A3B7D7',
          300: '#7593C3',
          400: '#476FAF',
          500: '#1A2A4F',
          600: '#14213F',
          700: '#0E1830',
          800: '#090F20',
          900: '#040710',
        },
        secondary: {
          DEFAULT: '#2C3E70', // Medium Blue
        },
        accent: {
          DEFAULT: '#F39C12', // Vibrant Orange
        },
        background: {
          DEFAULT: '#F4F7FC', // Light Gray / Off-white
        },
        surface: '#FFFFFF',
        border: '#E2E8F0',
        text: {
          DEFAULT: '#2C3E50',
          light: '#4A5568',
          dark: '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}