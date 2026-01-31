/**
 * AI Pandit Design System
 * Unified design tokens for Sacred Ivory Light Theme
 * 
 * Primary Palette:
 * - Background: #FFFCF8 (Ivory Pure)
 * - Surface: #FFFFFF (White)
 * - Primary: #B8860B (Sacred Gold)
 * - Secondary: #6B1F7A (Plum)
 * - Text: #1A1612 (Dark)
 * - Border: #F0E8DE (Pearl)
 */

// ═══════════════════════════════════════════════════════════════════════════
// COLOR TOKENS - Sacred Ivory Theme
// ═══════════════════════════════════════════════════════════════════════════

export const colors = {
  // Background colors
  bg: {
    primary: '#FFFCF8',      // Main page background (ivory pure)
    secondary: '#FDF8F3',    // Warm ivory background
    tertiary: '#FAF5EF',     // Cream background
    surface: '#FFFFFF',      // Card/surface backgrounds
    elevated: '#FDF8F3',     // Elevated surfaces
    input: '#FFFFFF',        // Input field backgrounds
    hover: '#F5EFE7',        // Hover states
  },

  // Text colors
  text: {
    primary: '#1A1612',      // Main headings and body
    secondary: '#4A453F',    // Secondary text
    muted: '#7A756F',        // Muted/helper text
    disabled: '#A8A39D',     // Disabled state
    subtle: '#D0CBC5',       // Very subtle text
  },

  // Accent colors
  accent: {
    primary: '#B8860B',      // Sacred gold
    primaryHover: '#D4A853', // Gold hover
    secondary: '#6B1F7A',    // Plum accent
    tertiary: '#2D7A5C',     // Sage green
    gold: '#B8860B',         // Traditional gold
    goldLight: '#D4A853',    // Light gold
    goldPale: '#F2E4C6',     // Pale gold
  },

  // Semantic colors
  semantic: {
    success: '#2D7A5C',      // Success green (sage)
    successLight: '#D4E5DE', // Light success background
    warning: '#E8A849',      // Warning orange
    error: '#C65D3B',        // Error terracotta
    errorLight: '#F4A896',   // Light error
    info: '#6B9AC4',         // Info blue
  },

  // Border colors
  border: {
    default: '#F0E8DE',      // Default borders (pearl)
    hover: '#E8E0D5',        // Hover borders
    accent: '#D4A853',       // Accent borders (gold)
    gold: 'rgba(184, 134, 11, 0.2)',  // Gold accent
    goldHover: 'rgba(184, 134, 11, 0.3)',
  },

  // Gradients
  gradient: {
    gold: 'linear-gradient(135deg, #B8860B 0%, #D4A853 50%, #E5C880 100%)',
    sunset: 'linear-gradient(135deg, #C65D3B 0%, #E08B6E 50%, #F4A896 100%)',
    plum: 'linear-gradient(135deg, #4A0E4E 0%, #6B1F7A 50%, #8B4A9C 100%)',
    sage: 'linear-gradient(135deg, #2D4A3E 0%, #4A7C6F 50%, #8FB3A5 100%)',
    hero: 'linear-gradient(180deg, #FFFCF8 0%, #FDF8F3 50%, #FAF5EF 100%)',
    card: 'linear-gradient(145deg, rgba(255, 252, 248, 0.95) 0%, rgba(250, 245, 239, 0.98) 100%)',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SPACING CONSTANTS (8px Base with Golden Ratio)
// ═══════════════════════════════════════════════════════════════════════════

export const spacing = {
  '0': '0px',
  '1': '4px',    // 4px
  '2': '8px',    // 8px
  '3': '12px',   // 12px
  '4': '16px',   // 16px
  '5': '20px',   // 20px
  '6': '24px',   // 24px
  '8': '32px',   // 32px
  '10': '40px',  // 40px
  '12': '48px',  // 48px
  '16': '64px',  // 64px
  '20': '80px',  // 80px
  '24': '96px',  // 96px
  // Golden ratio based
  golden: {
    '0': '0px',
    '1': '4px',
    '2': '8px',
    '3': '12px',
    '4': '16px',    // 16
    '5': '20px',    // 16 * 1.25 = 20
    '6': '24px',    // 20 * 1.2 = 24
    '7': '32px',    // 24 * 1.33 = 32
    '8': '40px',    // 32 * 1.25 = 40
    '9': '48px',    // 40 * 1.2 = 48
    '10': '64px',   // 48 * 1.33 = 64
  },
  // Fibonacci based
  fib: {
    '0': '0px',
    '1': '3px',
    '2': '5px',
    '3': '8px',
    '4': '13px',
    '5': '21px',
    '6': '34px',
    '7': '55px',
    '8': '89px',
    '9': '144px',
    '10': '233px',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// TYPOGRAPHY SCALE
// ═══════════════════════════════════════════════════════════════════════════

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    serif: ['Cormorant Garamond', 'Georgia', 'serif'],
    display: ['Playfair Display', 'Georgia', 'serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },

  sizes: {
    xs: { size: '12px', lineHeight: '16px' },
    sm: { size: '14px', lineHeight: '20px' },
    base: { size: '16px', lineHeight: '24px' },
    lg: { size: '18px', lineHeight: '28px' },
    xl: { size: '20px', lineHeight: '28px' },
    '2xl': { size: '24px', lineHeight: '32px' },
    '3xl': { size: '30px', lineHeight: '36px' },
    '4xl': { size: '36px', lineHeight: '40px' },
    '5xl': { size: '48px', lineHeight: '56px' },
  },

  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// BORDER RADIUS
// ═══════════════════════════════════════════════════════════════════════════

export const borderRadius = {
  none: '0px',
  sm: '8px',       // 8px
  base: '12px',    // 12px
  md: '16px',      // 16px
  lg: '20px',      // 20px (golden ratio approx)
  xl: '24px',      // 24px
  full: '9999px',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SHADOWS
// ═══════════════════════════════════════════════════════════════════════════

export const shadows = {
  sm: '0 1px 2px rgba(26, 22, 18, 0.04)',
  base: '0 2px 4px rgba(26, 22, 18, 0.06)',
  md: '0 4px 12px rgba(26, 22, 18, 0.08)',
  lg: '0 8px 24px rgba(26, 22, 18, 0.1)',
  xl: '0 16px 48px rgba(26, 22, 18, 0.12)',
  glow: {
    gold: '0 0 20px rgba(184, 134, 11, 0.2)',
    goldStrong: '0 0 34px rgba(184, 134, 11, 0.3)',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// TRANSITIONS
// ═══════════════════════════════════════════════════════════════════════════

export const transitions = {
  fast: '150ms ease',
  base: '250ms ease',
  slow: '350ms ease',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Z-INDEX SCALE
// ═══════════════════════════════════════════════════════════════════════════

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// BREAKPOINTS
// ═══════════════════════════════════════════════════════════════════════════

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS (Framer Motion)
// ═══════════════════════════════════════════════════════════════════════════

export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  },

  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },

  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },

  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.3 },
  },

  slideInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3 },
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT SIZES
// ═══════════════════════════════════════════════════════════════════════════

export const componentSizes = {
  input: {
    sm: { height: '40px', padding: '8px 12px' },
    md: { height: '48px', padding: '12px 16px' },
    lg: { height: '56px', padding: '16px 20px' },
  },
  button: {
    sm: { height: '32px', padding: '6px 12px', fontSize: '12px' },
    md: { height: '40px', padding: '8px 16px', fontSize: '14px' },
    lg: { height: '48px', padding: '12px 24px', fontSize: '16px' },
  },
  icon: {
    sm: '16px',
    md: '20px',
    lg: '24px',
    xl: '32px',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// CSS VARIABLE HELPER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generates CSS custom properties for the design system
 * Use this to apply tokens to :root or specific scopes
 */
export function generateCSSVariables(): Record<string, string> {
  return {
    // Backgrounds
    '--bg-primary': colors.bg.primary,
    '--bg-secondary': colors.bg.secondary,
    '--bg-tertiary': colors.bg.tertiary,
    '--bg-surface': colors.bg.surface,
    '--bg-elevated': colors.bg.elevated,
    '--bg-input': colors.bg.input,
    '--bg-hover': colors.bg.hover,

    // Text
    '--text-primary': colors.text.primary,
    '--text-secondary': colors.text.secondary,
    '--text-muted': colors.text.muted,
    '--text-disabled': colors.text.disabled,
    '--text-subtle': colors.text.subtle,

    // Accents
    '--accent-primary': colors.accent.primary,
    '--accent-primary-hover': colors.accent.primaryHover,
    '--accent-secondary': colors.accent.secondary,
    '--accent-tertiary': colors.accent.tertiary,
    '--accent-gold': colors.accent.gold,
    '--accent-gold-light': colors.accent.goldLight,
    '--accent-gold-pale': colors.accent.goldPale,

    // Semantic
    '--semantic-success': colors.semantic.success,
    '--semantic-success-light': colors.semantic.successLight,
    '--semantic-warning': colors.semantic.warning,
    '--semantic-error': colors.semantic.error,
    '--semantic-error-light': colors.semantic.errorLight,
    '--semantic-info': colors.semantic.info,

    // Borders
    '--border-default': colors.border.default,
    '--border-hover': colors.border.hover,
    '--border-accent': colors.border.accent,

    // Spacing
    '--space-1': spacing['1'],
    '--space-2': spacing['2'],
    '--space-3': spacing['3'],
    '--space-4': spacing['4'],
    '--space-5': spacing['5'],
    '--space-6': spacing['6'],
    '--space-8': spacing['8'],
    '--space-10': spacing['10'],
    '--space-12': spacing['12'],
    '--space-16': spacing['16'],

    // Border radius
    '--radius-sm': borderRadius.sm,
    '--radius-base': borderRadius.base,
    '--radius-md': borderRadius.md,
    '--radius-lg': borderRadius.lg,
    '--radius-xl': borderRadius.xl,

    // Shadows
    '--shadow-sm': shadows.sm,
    '--shadow-base': shadows.base,
    '--shadow-md': shadows.md,
    '--shadow-lg': shadows.lg,
    '--shadow-xl': shadows.xl,

    // Transitions
    '--transition-fast': transitions.fast,
    '--transition-base': transitions.base,
    '--transition-slow': transitions.slow,
  };
}

// Default export for convenience
export default {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  breakpoints,
  animations,
  componentSizes,
  generateCSSVariables,
};
