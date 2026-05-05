/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ═══════════════════════════════════════════════════════════════
      // AI Pandit Design System — Warm Sacred Palette
      // All hex values replaced with semantic tokens.
      // Use these instead of inline bg-[#...] everywhere.
      // ═══════════════════════════════════════════════════════════════
      colors: {
        // Surface — backgrounds, cards, containers
        surface: {
          base: '#FFFCF8',      // warm white (page bg)
          raised: '#FDF8F3',    // card/tile bg
          elevated: '#F5EFE7',  // accent bg, hover states
          muted: '#F0E8DE',     // subtle borders, dividers
        },

        // Primary — amber/gold CTAs, active states
        primary: {
          DEFAULT: '#B8860B',   // amber gold
          light: '#D4A843',     // hover/light
          dark: '#78611D',      // pressed/dark
          dim: '#9A7609',       // muted gold
        },

        // Trust — dark green, encryption/verified badges
        trust: {
          DEFAULT: '#184131',   // dark emerald
          light: '#3D9A73',     // success green
        },

        // Content — text colors
        content: {
          primary: '#1A1612',   // main text (near black)
          secondary: '#5A554F', // muted text (warm gray)
          disabled: '#8A857F',  // placeholder
        },

        // Destructive — errors, warnings, caution
        destructive: {
          DEFAULT: '#C65D3B',   // terracotta red
        },

        // Legacy gold scale (keep for existing gold-50 → gold-900 usage)
        gold: {
          50: '#fff9e6', 100: '#ffeeb3', 200: '#ffe380',
          300: '#ffd84d', 400: '#ffcd1a', 500: '#e6b300',
          600: '#b38a00', 700: '#806200', 800: '#4d3b00',
          900: '#1a1400',
        },
      },

      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
      },

      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
