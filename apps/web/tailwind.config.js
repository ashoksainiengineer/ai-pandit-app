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
      // AI PANDIT DESIGN SYSTEM — LIGHT THEME PALETTE
      // Clean monochrome with subtle spectrum accents
      // Single font: DM Sans (weights 300, 400, 500 only)
      // ═══════════════════════════════════════════════════════════════
      colors: {
        // Surface — backgrounds, cards, containers
        surface: {
          base: '#f8f8f8',      // page bg (dia canvas)
          raised: '#ffffff',    // card/tile bg
          elevated: '#efefef',  // accent bg, hover states
          muted: 'rgba(0,0,0,0.08)', // subtle borders, dividers
        },

        // Primary — black CTAs, active states
        primary: {
          DEFAULT: '#000000',   // black
          light: '#333333',     // hover/light
          dark: '#000000',      // pressed/dark
          dim: '#636363',       // muted
        },

        // Trust — dark green, encryption/verified badges
        trust: {
          DEFAULT: '#184131',   // dark emerald
          light: '#3D9A73',     // success green
        },

        // Content — text colors
        content: {
          primary: '#000000',   // main text
          secondary: '#636363', // muted text
          disabled: '#959595',  // placeholder
        },

        // Destructive — errors, warnings, caution
        destructive: {
          DEFAULT: '#636363',   // gray (dia style)
        },

        // Monochrome scale (replaces gold scale)
        gold: {
          50: '#f8f8f8', 100: '#efefef', 200: '#d9d9d9',
          300: '#b3b3b3', 400: '#8c8c8c', 500: '#636363',
          600: '#4d4d4d', 700: '#333333', 800: '#1a1a1a',
          900: '#000000',
        },

        // ═══════════════════════════════════════════════════════════════
        // PRISM DESIGN SYSTEM — "Prism on white stationery"
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
        // Clean minimal light theme
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
        display: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        prism: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        inter: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        'dia-heading': ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        'dia-serif': ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
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

      // ═══════════════════════════════════════════════════════════════
      // DESIGN SYSTEM EXTENSIONS
      // ═══════════════════════════════════════════════════════════════

      backdropBlur: {
        'dia-xs': '4px',
        'dia-sm': '8px',
        'dia-md': '16px',
        'dia-lg': '24px',
        'dia-xl': '40px',
        'dia-2xl': '60px',
        'dia-3xl': '80px',
      },

      transitionTimingFunction: {
        'dia-out': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'dia-out-slow': 'cubic-bezier(0.77, 0, 0.175, 1)',
        'dia-in-out': 'cubic-bezier(0.87, 0, 0.13, 1)',
      },

      fontSize: {
        'dia-caption': ['0.8125rem', { lineHeight: '1.5', letterSpacing: '0em' }],
        'dia-body': ['1.125rem', { lineHeight: '1.5', letterSpacing: '0em' }],
        'dia-body-lg': ['1.375rem', { lineHeight: '1.5', letterSpacing: '0em' }],
        'dia-subheading': ['1.125rem', { lineHeight: '1.33', letterSpacing: '0em' }],
        'dia-heading-sm': ['1.375rem', { lineHeight: '1.25', letterSpacing: '-0.02em' }],
        'dia-heading': ['3.125rem', { lineHeight: '1.18', letterSpacing: '-0.04em' }],
        'dia-heading-lg': ['3.375rem', { lineHeight: '1.17', letterSpacing: '-0.04em' }],
        'dia-display': ['4.5rem', { lineHeight: '1.11', letterSpacing: '-0.04em' }],
        'dia-display-lg': ['7.2rem', { lineHeight: '1.05', letterSpacing: '-0.05em' }],
      },

      letterSpacing: {
        'dia-tight': '-0.04em',
        'dia-tighter': '-0.05em',
        'dia-normal': '-0.02em',
        'dia-wide': '0.02em',
        'dia-wider': '0.05em',
      },

      opacity: {
        'dia-3': '0.03',
        'dia-5': '0.05',
        'dia-8': '0.08',
        'dia-10': '0.10',
        'dia-15': '0.15',
        'dia-40': '0.40',
        'dia-60': '0.60',
        'dia-70': '0.70',
        'dia-85': '0.85',
      },

      backgroundImage: {
        'dia-mesh': 'radial-gradient(at 40% 20%, rgba(168, 196, 232, 0.6) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(200, 221, 245, 0.5) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(184, 211, 238, 0.5) 0px, transparent 50%), radial-gradient(at 80% 50%, rgba(168, 196, 232, 0.4) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(200, 221, 245, 0.5) 0px, transparent 50%)',
        'dia-glow': 'radial-gradient(circle at 50% 50%, rgba(168, 196, 232, 0.4) 0%, transparent 70%)',
        'dia-glow-strong': 'radial-gradient(circle at 50% 50%, rgba(168, 196, 232, 0.6) 0%, transparent 60%)',
        'dia-spectrum': 'linear-gradient(90deg, #c679c4 0%, #fa3d1d 25%, #ffb005 50%, #e1e1fe 75%, #0358f7 100%)',
      },

      scale: {
        'dia-98': '0.98',
        'dia-99': '0.99',
        'dia-101': '1.01',
        'dia-102': '1.02',
      },

      rotate: {
        'dia-1': '1deg',
        'dia-neg1': '-1deg',
        'dia-2': '2deg',
        'dia-neg2': '-2deg',
      },

      zIndex: {
        'dia-header': '50',
        'dia-overlay': '40',
        'dia-modal': '30',
        'dia-tooltip': '20',
        'dia-content': '10',
        'dia-bg': '-10',
      },

      saturate: {
        'dia-150': '1.5',
        'dia-180': '1.8',
      },

      brightness: {
        'dia-105': '1.05',
        'dia-110': '1.10',
      },

      maxWidth: {
        'dia-container': '1200px',
        'dia-narrow': '900px',
        'dia-wide': '1400px',
      },

      gap: {
        'dia-1': '0.3125rem',
        'dia-2': '0.375rem',
        'dia-3': '0.625rem',
        'dia-4': '0.875rem',
        'dia-5': '0.9375rem',
        'dia-6': '1.25rem',
        'dia-7': '1.5rem',
        'dia-8': '2rem',
        'dia-9': '2.125rem',
        'dia-10': '3rem',
      },

      translate: {
        'dia-1': '0.25rem',
        'dia-2': '0.5rem',
        'dia-4': '1rem',
        'dia-8': '2rem',
        'dia-16': '4rem',
      },

      ringWidth: {
        'dia': '1px',
        'dia-2': '2px',
        'dia-3': '3px',
      },

      ringColor: {
        'dia-blue': 'rgba(168, 196, 232, 0.5)',
        'dia-ink': 'rgba(0, 0, 0, 0.08)',
      },

      ringOffsetWidth: {
        'dia': '2px',
      },

      width: {
        'dia-container': '1200px',
      },

      height: {
        'dia-header': '3.25rem',
        'dia-section-sm': '80px',
        'dia-section': '120px',
      },

      minHeight: {
        'dia-screen': '100dvh',
      },

      padding: {
        'dia-1': '0.3125rem',
        'dia-2': '0.375rem',
        'dia-3': '0.625rem',
        'dia-4': '0.875rem',
        'dia-5': '0.9375rem',
        'dia-6': '1.25rem',
        'dia-7': '1.5rem',
        'dia-8': '2rem',
        'dia-9': '2.125rem',
        'dia-10': '3rem',
        'dia-11': '4rem',
        'dia-12': '5rem',
        'dia-13': '6rem',
        'dia-14': '7.5rem',
      },

      margin: {
        'dia-1': '0.3125rem',
        'dia-2': '0.375rem',
        'dia-3': '0.625rem',
        'dia-4': '0.875rem',
        'dia-5': '0.9375rem',
        'dia-6': '1.25rem',
        'dia-7': '1.5rem',
        'dia-8': '2rem',
        'dia-9': '2.125rem',
        'dia-10': '3rem',
        'dia-11': '4rem',
        'dia-12': '5rem',
        'dia-13': '6rem',
        'dia-14': '7.5rem',
      },
    },
  },
  plugins: [],
};
