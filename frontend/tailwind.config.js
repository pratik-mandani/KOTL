/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        kid: {
          blue: '#1E88E5',
          deepblue: '#0D47A1',
          lightblue: '#E3F2FD',
          yellow: '#FDD835',
          gold: '#FFB300',
          lightyellow: '#FFF9C4',
          warmwhite: '#FFFDF9',
          paper: '#FAF7F2',
          cream: '#FFF8E7',
          coral: '#FF5252',
          red: '#E53935',
          green: '#43A047',
          lightgreen: '#E8F5E9',
          border: '#FFE082',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        play: ['"Comic Neue"', '"Fredoka"', 'cursive', 'sans-serif'],
      },
      boxShadow: {
        'bubbly': '0 8px 0 rgba(13, 71, 161, 0.15)',
        'yellow-bubbly': '0 6px 0 #FFB300',
        'blue-bubbly': '0 6px 0 #0D47A1',
        'soft-cloud': '0 10px 25px -5px rgba(30, 136, 229, 0.08), 0 8px 10px -6px rgba(253, 216, 53, 0.1)',
      },
      borderRadius: {
        'bubble': '1.75rem',
        'cloud': '2.25rem',
      },
    },
  },
  plugins: [],
};
