/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./App.tsx",
    "./index.tsx"
  ],
  theme: {
    extend: {
      fontFamily: {
        diablo: ['"Cinzel Decorative"', 'serif'],
        serif: ['"Cinzel"', 'serif'],
        sans: ['"Lato"', 'sans-serif'],
      },
      colors: {
        sanctuary: {
          900: '#0c0a09', // Stone dark
          800: '#1c1917',
          red: '#7f1d1d', // Blood red
          gold: '#b45309', // Muted gold
          accent: '#f59e0b', // Bright gold
        }
      },
      backgroundImage: {
        'diablo-pattern': "radial-gradient(circle at center, #1c1917 0%, #000000 100%)",
      }
    }
  },
  plugins: [],
}
