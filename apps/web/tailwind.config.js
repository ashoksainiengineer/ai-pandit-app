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

        // ═══════════════════════════════════════════════════════════════
        // PRISM DESIGN SYSTEM — "Prism on white stationery"
        // Light refracts color from a nearly monochrome surface.
        // ═══════════════════════════════════════════════════════════════
        prism: {
          // Neutrals
          ink: '#000000',
          snow: '#ffffff',
          canvas: '#f8f8f8',
          fog: '#efefef',
          pebble: '#d9d9d9',
          graphite: '#636363',
          slate: '#959595',
          steel: '#aeaeae',
          ash: '#7c7c7c',
          // Spectrum
          'rose-quartz': '#c679c4',
          crimson: '#fa3d1d',
          marigold: '#ffb005',
          lavender: '#e1e1fe',
          'signal-blue': '#0358f7',
          'hot-pink': '#fd02f5',
        },

        // ═══════════════════════════════════════════════════════════════
        // DIA BROWSER INSPIRED — Clean minimal light theme
        // ═══════════════════════════════════════════════════════════════
        dia: {
          bg: '#F8F8F8',
          'bg-warm': '#FAFAFA',
          ink: '#000000',
          'ink-muted': 'rgba(0,0,0,0.6)',
          'ink-subtle': 'rgba(0,0,0,0.4)',
          'ink-faint': 'rgba(0,0,0,0.15)',
          border: 'rgba(0,0,0,0.08)',
          'border-strong': 'rgba(0,0,0,0.12)',
          card: '#FFFFFF',
          'hero-blue-start': '#a8c4e8',
          'hero-blue-end': '#c8ddf5',
          'hero-blue-mid': '#b8d3ee',
        },
      },

      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-cormorant)', 'Georgia', 'serif'],
        // Prism design system fonts
        prism: ['var(--font-inter)', 'var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        inter: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        // Dia-inspired fonts
        'dia-heading': ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        'dia-serif': ['var(--font-playfair)', 'Georgia', 'serif'],
        'dia-mono': ['var(--font-mono)', 'monospace'],
      },

      borderRadius: {
        'prism-sm': '0.625rem',    // 10px — images
        'prism-md': '1rem',        // 16px — nav items, pills
        'prism-lg': '1.25rem',     // 20px — cards, containers
        'prism-xl': '1.875rem',    // 30px — cards, filled buttons
        'prism-2xl': '2.5rem',     // 40px — large containers
        'dia-sm': '12px',
        'dia-md': '16px',
        'dia-lg': '20px',
        'dia-xl': '24px',
        'dia-2xl': '32px',
      },

      boxShadow: {
        'prism-sm': '0 0 8px 0 rgba(0, 0, 0, 0.08)',
        'prism-none': 'none',
        'dia-sm': '0 2px 8px rgba(0,0,0,0.04)',
        'dia-md': '0 4px 24px rgba(0,0,0,0.06)',
        'dia-lg': '0 8px 40px rgba(0,0,0,0.08)',
        'dia-float': '0 12px 48px rgba(0,0,0,0.10)',
      },

      spacing: {
        'prism-1': '0.3125rem',   // 5px
        'prism-2': '0.375rem',    // 6px
        'prism-3': '0.625rem',    // 10px
        'prism-4': '0.875rem',    // 14px
        'prism-5': '0.9375rem',   // 15px
        'prism-6': '1.25rem',     // 20px
        'prism-7': '1.5rem',      // 24px
        'prism-8': '2rem',        // 32px
        'prism-9': '2.125rem',    // 34px
        'prism-10': '3rem',       // 48px
        'prism-11': '4rem',       // 64px
        'prism-12': '5rem',       // 80px
        'prism-13': '6rem',       // 96px
        'prism-14': '7.5rem',     // 120px
      },

      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'prism-fade-in-up': 'prismFadeInUp 0.5s ease-out forwards',
        'prism-fade-in': 'prismFadeIn 0.4s ease-out forwards',
        'prism-scale-in': 'prismScaleIn 0.4s ease-out forwards',
        'prism-gentle-float': 'prismGentleFloat 4s ease-in-out infinite',
        'prism-gradient-sweep': 'prismGradientSweep 3s ease infinite',
        'prism-shimmer': 'prismShimmer 2s ease-in-out infinite',
        'dia-float': 'diaFloat 6s ease-in-out infinite',
        'dia-float-slow': 'diaFloatSlow 8s ease-in-out infinite',
        'dia-float-delayed': 'diaFloat 6s ease-in-out infinite 2s',
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
        prismFadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        prismFadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        prismScaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        prismGentleFloat: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        prismGradientSweep: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        prismShimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        diaFloat: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-16px) rotate(1deg)' },
        },
        diaFloatSlow: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(-1deg)' },
        },
      },
    },
  },
  plugins: [],
};
