module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0a0a0f',
          800: '#12121a',
          700: '#1a1a2e',
          600: '#16213e',
          500: '#1e2a4a'
        },
        accent: {
          primary: '#00d4ff',
          secondary: '#7b2fff',
          success: '#00ff88',
          danger: '#ff4444',
          warning: '#ffaa00'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Courier New', 'monospace']
      }
    }
  },
  plugins: []
}
