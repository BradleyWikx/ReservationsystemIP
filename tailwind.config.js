/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'roboto-slab': ['Roboto Slab', 'serif'],
      },
      colors: {
        'accent-gold': '#F59E0B',
        'accent-crimson': '#B91C1C',
        'primary-indigo': '#4f46e5',
        'primary-indigo-darker': '#4338ca',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
