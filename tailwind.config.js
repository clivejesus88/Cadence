export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Inter', 'sans-serif']
      },
      colors: {
        ink: {
          950: '#0a0d10',
          900: '#0f1216',
          850: '#13161b',
          800: '#181c22',
          700: '#20252c',
          600: '#2a3038',
          500: '#3a414b'
        },
        ember: {
          300: '#fdba74',
          400: '#fb923c',
          500: '#f59e0b',
          600: '#ea580c'
        }
      },
      boxShadow: {
        glow: '0 0 90px 20px rgba(251,146,60,0.22)'
      },
      keyframes: {
        'fade-in': {
          '0%': {
            opacity: '0'
          },
          '100%': {
            opacity: '1'
          }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out'
      }
    }
  }
}
