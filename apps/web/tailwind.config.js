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
        // AI Pandit Unified Design System
        // Background colors
        'bg-primary': '#0A0F1C',
        'bg-secondary': '#0F1419',
        'bg-surface': '#1A1F2E',
        'bg-elevated': '#242B3D',
        'bg-input': '#2A3442',
        'bg-hover': '#3A4555',
        
        // Text colors
        'text-primary': '#F5F0EB',
        'text-secondary': '#C4B8AD',
        'text-muted': '#8C7F72',
        'text-disabled': '#5A6475',
        
        // Accent colors (Primary: Purple #8B5CF6)
        'accent-primary': '#8B5CF6',
        'accent-primary-hover': '#7C3AED',
        'accent-secondary': '#6366F1',
        
        // Gold accent colors
        'accent-gold': '#D4AF37',
        'accent-gold-light': '#E8C54D',
        'accent-gold-muted': '#C9A961',
        
        // Semantic colors
        'success': '#2D7A5C',
        'success-light': '#3D9A73',
        'warning': '#E8A849',
        'error': '#EF4444',
        'error-light': '#F87171',
        'info': '#6B9AC4',
        
        // Border colors
        'border-default': '#2A3442',
        'border-hover': '#3A4555',
        'border-accent': '#8B5CF6',
        
        // Legacy Vedic Theme Colors (kept for backward compatibility)
        'bg-base': '#1A1614',
        gold: {
          50: '#fff9e6',
          100: '#ffeeb3',
          200: '#ffe380',
          300: '#ffd84d',
          400: '#ffcd1a',
          500: '#e6b300',
          600: '#b38a00',
          700: '#806200',
          800: '#4d3b00',
          900: '#1a1400',
        },
        vedic: {
          orange: '#FF6B35',
          saffron: '#FF9F1C',
          maroon: '#8B0000',
          cream: '#FFF8F0',
          navy: '#1a1a2e',
          purple: '#4a0e4e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      spacing: {
        // Mathematical Design System - Fibonacci Sequence
        'fib-0': '0px',
        'fib-1': '3px',    // 3
        'fib-2': '5px',    // 5
        'fib-3': '8px',    // 8
        'fib-4': '13px',   // 13
        'fib-5': '21px',   // 21
        'fib-6': '34px',   // 34
        'fib-7': '55px',   // 55
        'fib-8': '89px',   // 89
        'fib-9': '144px',  // 144
        'fib-10': '233px', // 233
        'fib-11': '377px', // 377
      },
      fontSize: {
        // Golden Typescale: 16 * φ^n (φ = 1.618033988749)
        'h6': ['13px', { lineHeight: '21px', letterSpacing: '0.02em' }],   // 16 / 1.618 ≈ 9.89 → 13 (Fibonacci)
        'h5': ['16px', { lineHeight: '24px', letterSpacing: '0.01em' }],   // Base: 16px
        'h4': ['21px', { lineHeight: '34px', letterSpacing: '-0.01em' }],  // 16 * 1.618 ≈ 25.89 → 21 (Fibonacci)
        'h3': ['34px', { lineHeight: '55px', letterSpacing: '-0.02em' }],  // 21 * 1.618 ≈ 33.98 → 34 (Fibonacci)
        'h2': ['55px', { lineHeight: '89px', letterSpacing: '-0.02em' }],  // 34 * 1.618 ≈ 54.97 → 55 (Fibonacci)
        'h1': ['89px', { lineHeight: '144px', letterSpacing: '-0.03em' }], // 55 * 1.618 ≈ 88.99 → 89 (Fibonacci)
        // Additional mathematical scales
        'phi-xs': ['10px', { lineHeight: '16px' }],   // 16 / φ² ≈ 6.11 → 10
        'phi-sm': ['14px', { lineHeight: '21px' }],   // 16 / φ ≈ 9.89 → 14
        'phi-base': ['16px', { lineHeight: '26px' }], // Base with φ line height
        'phi-lg': ['26px', { lineHeight: '42px' }],   // 16 * φ ≈ 25.89 → 26
        'phi-xl': ['42px', { lineHeight: '68px' }],   // 26 * φ ≈ 42.07 → 42
      },
      borderRadius: {
        'fib-1': '3px',    // 3
        'fib-2': '5px',    // 5
        'fib-3': '8px',    // 8
        'fib-4': '13px',   // 13
        'fib-5': '21px',   // 21
        'fib-6': '34px',   // 34
        'golden': '21px',  // Primary golden radius
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-vedic': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        'gradient-saffron': 'linear-gradient(135deg, #ff9f1c 0%, #ff6b35 100%)',
        'gradient-gold': 'linear-gradient(135deg, #f5af19 0%, #f12711 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 20s linear infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'spiral': 'spiral 10s linear infinite',
        'fibonacci-float': 'fibonacci-float 8s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #ff9f1c, 0 0 10px #ff9f1c, 0 0 15px #ff9f1c' },
          '100%': { boxShadow: '0 0 10px #ff6b35, 0 0 20px #ff6b35, 0 0 30px #ff6b35' },
        },
        spiral: {
          '0%': { transform: 'rotate(0deg) scale(1)' },
          '100%': { transform: 'rotate(360deg) scale(1.618)' },
        },
        'fibonacci-float': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '33%': { transform: 'translateY(-13px) rotate(137.5deg)' },
          '66%': { transform: 'translateY(-8px) rotate(275deg)' },
        },
      },
      opacity: {
        // Golden Ratio opacity levels
        'phi': '0.618',
        'phi-light': '0.382', // 1 - 0.618
        'phi-dark': '0.786', // 0.618 * 1.272
        'phi-subtle': '0.236', // 0.382 * 0.618
        'phi-strong': '0.854', // 0.618 + (1-0.618)*0.618
      },
      width: {
        // Golden Ratio proportions
        'golden-main': '61.8%',
        'golden-side': '38.2%',
        'phi-w-1': '23.6%', // 38.2% * 0.618
        'phi-w-2': '14.6%', // 23.6% * 0.618
        'phi-w-3': '9.0%',  // 14.6% * 0.618
      },
      height: {
        'golden-screen': '61.8vh',
        'phi-h-1': '23.6vh',
        'phi-h-2': '14.6vh',
        'phi-h-3': '9.0vh',
      },
      zIndex: {
        'phi': '1618',
        'fib-max': '144',
        'fib-high': '89',
        'fib-mid': '55',
        'fib-low': '34',
      },
      ringWidth: {
        'fib-1': '3px',
        'fib-2': '5px',
        'fib-3': '8px',
      },
      boxShadow: {
        'phi': '0 0 21px rgba(212, 175, 55, 0.382)',
        'phi-strong': '0 0 34px rgba(212, 175, 55, 0.618)',
        'phi-subtle': '0 0 13px rgba(212, 175, 55, 0.236)',
        'fib-glow': '0 0 55px rgba(255, 159, 28, 0.618)',
      },
      backdropBlur: {
        'phi': '21px',
        'fib-1': '13px',
        'fib-2': '21px',
        'fib-3': '34px',
      },
      screens: {
        // Fibonacci-based breakpoints
        'fib-sm': '610px',   // 987 * 0.618 ≈ 610
        'fib-md': '987px',   // 1597 * 0.618 ≈ 987
        'fib-lg': '1597px',  // 2584 * 0.618 ≈ 1597
        'fib-xl': '2584px',  // 4181 * 0.618 ≈ 2584
      },
      transitionDuration: {
        // Mathematical timing based on golden ratio
        'phi': '618ms',      // φ * 1000ms ≈ 618ms
        'phi-fast': '382ms', // (1/φ) * 1000ms ≈ 382ms
        'phi-slow': '1618ms', // φ² * 1000ms ≈ 1618ms
      },
    },
  },
  plugins: [],
}
