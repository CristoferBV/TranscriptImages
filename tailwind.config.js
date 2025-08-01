/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      spacing: {
        'safe-area-bottom': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
};
