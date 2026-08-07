/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces_600SemiBold', 'serif'],
        sans: ['Inter_400Regular', 'sans-serif'],
        'sans-medium': ['Inter_500Medium', 'sans-serif'],
        'sans-semibold': ['Inter_600SemiBold', 'sans-serif'],
        'sans-bold': ['Inter_700Bold', 'sans-serif'],
        'sans-extrabold': ['Inter_800ExtraBold', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#0a0d10',
          900: '#0f1216',
          850: '#13161b',
          800: '#181c22',
          700: '#20252c',
          600: '#2a3038',
          500: '#3a414b',
        },
        ember: {
          300: '#fdba74',
          400: '#fb923c',
          500: '#f59e0b',
          600: '#ea580c',
        },
      },
      boxShadow: {
        glow: '0 0 90px 20px rgba(251,146,60,0.22)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out',
      },
    },
  },
  plugins: [],
};
