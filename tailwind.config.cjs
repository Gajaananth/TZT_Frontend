/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backdropBlur: {
        glass: '20px',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
      },
      keyframes: {
        'mesh-drift': {
          '0%': { transform: 'translate3d(-2%, -1%, 0) scale(1)' },
          '100%': { transform: 'translate3d(5%, 4%, 0) scale(1.08)' },
        },
      },
      animation: {
        'mesh-drift': 'mesh-drift 18s ease-in-out infinite alternate',
      },
      colors: {
        glass: 'rgba(255, 255, 255, 0.55)',
      },
    },
  },
  plugins: [],
}