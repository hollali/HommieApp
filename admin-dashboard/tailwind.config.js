/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4560F7',
          light: '#E8EDFF',
          dark: '#2D4AE5',
        },
        background: '#F5F5F5',
        surface: '#FFFFFF',
        text: {
          primary: '#000000',
          secondary: '#999999',
          muted: '#999999',
        },
        border: '#E0E0E0',
        error: '#FF3B30',
        success: '#34C759',
        warning: '#FF9500',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
