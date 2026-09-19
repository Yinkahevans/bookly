/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#0F2A47', light: '#1C3D5A' },
        orange: { DEFAULT: '#F2793A', light: '#FDBA88', dark: '#D9611F' },
        cream: '#FAF7F2',
        slate: '#3A4552',
      },
    },
  },
  plugins: [],
};
