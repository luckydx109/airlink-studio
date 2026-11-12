/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/index.html",
    "./src/renderer/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        glass: {
          light: 'rgba(255, 255, 255, 0.70)',
          dark: 'rgba(18, 22, 34, 0.75)',
          border: 'rgba(255, 255, 255, 0.12)',
          'border-light': 'rgba(0, 0, 0, 0.08)',
          card: 'rgba(255, 255, 255, 0.05)',
          'card-hover': 'rgba(255, 255, 255, 0.08)',
        },
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc7fb',
          400: '#38a8f8',
          500: '#0c8de9',
          600: '#0270c7',
          700: '#0359a1',
          800: '#074b85',
          900: '#0c406e',
          cyan: '#00d2ff',
          indigo: '#6366f1',
          emerald: '#10b981',
          rose: '#f43f5e'
        }
      },
      backdropBlur: {
        xs: '2px',
        glass: '16px',
        super: '28px',
      },
      boxShadow: {
        'glass-subtle': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'glass-glow': '0 0 35px -5px rgba(56, 168, 248, 0.25)',
        'glass-lg': '0 20px 40px -15px rgba(0, 0, 0, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}

