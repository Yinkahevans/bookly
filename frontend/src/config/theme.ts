// Bookly brand tokens — mirrors tailwind.config.js. Import here when you need
// raw hex values outside of Tailwind classes (charts, canvas, email templates).
export const theme = {
  colors: {
    navy: '#0F2A47',
    navyLight: '#1C3D5A',
    orange: '#F2793A',
    orangeLight: '#FDBA88',
    orangeDark: '#D9611F',
    cream: '#FAF7F2',
    slate: '#3A4552',
  },
  fonts: {
    display: '"Fraunces", serif',
    body: '"Inter", sans-serif',
  },
} as const;
