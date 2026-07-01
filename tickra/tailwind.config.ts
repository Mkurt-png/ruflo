import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        // Diagonal shimmer sweep across a surface — premium CTA / pricing card.
        shimmer: {
          '0%':   { transform: 'translateX(-120%) skewX(-12deg)' },
          '100%': { transform: 'translateX(220%) skewX(-12deg)' },
        },
        // Conic gradient rotation for animated borders on premium cards.
        'border-spin': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        // Slow holographic gradient sweep for headline accents.
        holo: {
          '0%':   { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        // Soft floating pulse for status orbs.
        'pulse-soft': {
          '0%, 100%': { opacity: '0.85', transform: 'scale(1)' },
          '50%':      { opacity: '1',    transform: 'scale(1.08)' },
        },
        // CRT scanline drift for terminal panels.
        scanlines: {
          '0%':   { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 6px' },
        },
      },
      animation: {
        ticker: 'ticker 40s linear infinite',
        shimmer: 'shimmer 2.4s cubic-bezier(0.16, 1, 0.3, 1) infinite',
        'border-spin': 'border-spin 8s linear infinite',
        holo: 'holo 9s linear infinite',
        'pulse-soft': 'pulse-soft 2.2s ease-in-out infinite',
        scanlines: 'scanlines 0.6s linear infinite',
      },
      borderRadius: {
        // TICKRA-REDESIGN (glassmorphism): softer corners everywhere. Cards use
        // rounded-sm across the app, so bumping it rounds the whole UI at once.
        sm: '0.6rem',
        DEFAULT: '0.75rem',
        md: '0.9rem',
        lg: '1.1rem',
      },
      boxShadow: {
        // Frosted-glass elevation: soft cool shadow + faint holographic rim.
        glass: '0 1px 0 rgb(255 255 255 / 0.55) inset, 0 20px 60px -30px rgb(var(--glow) / 0.45), 0 8px 30px -18px rgb(var(--ink) / 0.18)',
        'glass-lg': '0 1px 0 rgb(255 255 255 / 0.6) inset, 0 40px 100px -40px rgb(var(--glow) / 0.5), 0 12px 40px -20px rgb(var(--ink) / 0.22)',
        'glow-brand': '0 0 0 1px rgb(var(--brand) / 0.25), 0 0 40px -8px rgb(var(--brand) / 0.55)',
        'glow-up':    '0 0 0 1px rgb(var(--up) / 0.25),    0 0 40px -8px rgb(var(--up) / 0.55)',
        'glow-down':  '0 0 0 1px rgb(var(--down) / 0.25),  0 0 40px -8px rgb(var(--down) / 0.55)',
        'glow-xl':    '0 0 0 1px rgb(var(--brand) / 0.30), 0 0 80px -10px rgb(var(--brand) / 0.55)',
        'inset-line': 'inset 0 1px 0 rgb(255 255 255 / 0.06), inset 0 0 0 1px rgb(255 255 255 / 0.04)',
      },
      colors: {
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        elevated: 'rgb(var(--elevated) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        subtle: 'rgb(var(--subtle) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        brand: 'rgb(var(--brand) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        glow: 'rgb(var(--glow) / <alpha-value>)',
        up: 'rgb(var(--up) / <alpha-value>)',
        down: 'rgb(var(--down) / <alpha-value>)',
        // TICKRA-REDESIGN: Premium Navy palette for the landing redesign.
        // Scoped to landing sections; rest of app keeps the existing tokens above.
        navy: {
          950: '#0D1421',
          900: '#1A2E4A',
          800: '#1E3A5F',
          700: '#2A4A73',
          600: '#3A5A88',
        },
        'accent-blue': {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
        },
        success: '#059669',
        warning: '#D97706',
        danger: '#DC2626',
        gold: '#F0B429',
        'surface-warm': '#F8F7F4',
        'surface-card': '#FFFFFF',
        'surface-muted': '#F1F0ED',
        'text-primary': '#1C1917',
        'text-secondary': '#57534E',
        'text-muted': '#A8A29E',
        'text-inverse': '#F5F5F4',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(3rem, 7vw, 6.5rem)', { lineHeight: '0.95', letterSpacing: '-0.035em' }],
        'display-lg': ['clamp(2.25rem, 5vw, 4.25rem)', { lineHeight: '1', letterSpacing: '-0.03em' }],
        'display-md': ['clamp(1.75rem, 3.2vw, 2.75rem)', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
      },
      maxWidth: { container: '1280px' },
      transitionTimingFunction: { 'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)' },
    },
  },
  plugins: [],
};

export default config;
