/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ea1aa8', // The primary accent color
          light: '#f54bc2',   // A lighter version
          dark: '#c5108b',    // A darker version
        },
      },
    },
  },
  plugins: [],
} 