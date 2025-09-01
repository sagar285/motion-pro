import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin-slow 3s linear infinite',
        'fade-in': 'fade-in 1s ease-out',
        'fade-in-delay': 'fade-in-delay 2s ease-out',
      },
      keyframes: {
        'spin-slow': {
          from: { transform: 'rotate(45deg)' },
          to: { transform: 'rotate(405deg)' }
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(30px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        },
        'fade-in-delay': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '50%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}

export default config