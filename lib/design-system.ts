/**
 * AI Pandit Design System
 * Unified design tokens and constants for consistent theming across the app
 * 
 * Primary Colors:
 * - Background: #0A0F1C (deep navy)
 * - Surface: #1A1F2E (card backgrounds)
 * - Primary: #8B5CF6 (purple accent)
 * - Gold: #D4AF37 (traditional accent)
 * - Text: #F5F0EB (off-white)
 * - Border: #2A3442 (subtle borders)
 */

// ═══════════════════════════════════════════════════════════════════════════
// COLOR TOKENS
// ═══════════════════════════════════════════════════════════════════════════

export const colors = {
  // Background colors
  bg: {
    primary: '#0A0F1C',      // Main page background
    secondary: '#0F1419',    // Alternative background
    surface: '#1A1F2E',      // Card/surface backgrounds
    elevated: '#242B3D',     // Elevated surfaces
    input: '#2A3442',        // Input field backgrounds
    hover: '#3A3442',        // Hover states
  },

  // Text colors
  text: {
    primary: '#F5F0EB',      // Main headings and body
    secondary: '#C4B8AD',    // Secondary text
    muted: '#8C7F72',        // Muted/helper text
    disabled: '#5A6475',     // Disabled state
  },

  // Accent colors
  accent: {
    primary: '#8B5CF6',      // Primary purple
    primaryHover: '#7C3AED', // Purple hover
    secondary: '#6366F1',    // Secondary indigo
    gold: '#D4AF37',         // Traditional gold
    goldLight: '#E8C54D',    // Light gold
    goldMuted: '#C9A961',    // Muted gold
  },

  // Semantic colors
  semantic: {
    success: '#2D7A5C',      // Success green
    successLight: '#3D9A73', // Light success
    warning: '#E8A849',      // Warning orange
    error: '#EF4444',        // Error red
    errorLight: '#F87171',   // Light error
    info: '#6B9AC4',         // Info blue
  },

  // Border colors
  border: {
    default: '#2A3442',      // Default borders
    hover: '#3A4555',        // Hover borders
    accent: '#8B5CF6',       // Accent borders
    gold: 'rgba(212, 175, 55, 0.2)',  // Gold accent
    goldHover: 'rgba(212, 175, 55, 0.3)',
  },

  // Gradients
  gradient: {
    primary: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
    gold: 'linear-gradient(135deg, #D4AF37 0%, #C9A961 100%)',
    cosmic: 'linear-gradient(135deg, #0A0F1C 0%, #1A1F2E 50%, #2A3442 100%)',
    purple: 'linear-gradient(135deg, #6A0572 0%, #8B5CF6 100%)',
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SPACING CONSTANTS (Fibonacci Scale)
// ═══════════════════════════════════════════════════════════════════════════

export const spacing = {
  '0': '0px',
  '1': '4px',
  '2': '8px',
  '3': '12px',
  '4': '16px',
  '5': '24px',
  '6': '32px',
  '7': '48px',
  '8': '64px',
  '9': '96px',
  '10': '128px',
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
    serif: ['Playfair Display', 'Georgia', 'serif'],
    mono: ['JetBrains Mono', 'monospace'],
    display: ['Poppins', 'sans-serif'],
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
  sm: '4px',
  base: '8px',
  md: '12px',
  lg: '16px',
  xl: '21px',      // Golden ratio
  '2xl': '24px',
  full: '9999px',
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// SHADOWS
// ═══════════════════════════════════════════════════════════════════════════

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  base: '0 2px 4px rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px rgba(0, 0, 0, 0.4)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.5)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.5)',
  glow: {
    gold: '0 0 20px rgba(212, 175, 55, 0.3)',
    purple: '0 0 20px rgba(139, 92, 246, 0.3)',
    goldStrong: '0 0 34px rgba(212, 175, 55, 0.4)',
    purpleStrong: '0 0 34px rgba(139, 92, 246, 0.4)',
  },
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
    transition: { duration: 0.3, ease: 'easeOut' },
  },

  slideInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },

  slideInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },

  // Stagger children
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  },

  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },

  // Card hover
  cardHover: {
    scale: 1.02,
    transition: { duration: 0.2, ease: 'easeOut' },
  },

  // Button press
  buttonTap: {
    scale: 0.98,
  },

  // Page transition
  pageTransition: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Z-INDEX SCALE
// ═══════════════════════════════════════════════════════════════════════════

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  navbar: 400,
  modalBackdrop: 500,
  modal: 600,
  popover: 700,
  tooltip: 800,
  toast: 900,
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
// COMPONENT-SPECIFIC STYLES
// ═══════════════════════════════════════════════════════════════════════════

export const components = {
  // Card styles
  card: {
    base: `bg-[${colors.bg.surface}] border border-[${colors.border.default}] rounded-xl`,
    hover: `hover:border-[${colors.border.hover}] transition-colors duration-200`,
  },

  // Button styles
  button: {
    primary: `bg-gradient-to-r from-[${colors.accent.primary}] to-[${colors.accent.secondary}] text-white font-semibold rounded-lg`,
    secondary: `bg-[${colors.bg.input}] text-[${colors.text.primary}] border border-[${colors.border.default}] rounded-lg`,
    outline: `bg-transparent text-[${colors.accent.gold}] border-2 border-[${colors.accent.gold}] rounded-lg`,
  },

  // Input styles
  input: {
    base: `bg-[${colors.bg.input}] border border-[${colors.border.default}] rounded-xl text-[${colors.text.primary}]`,
    focus: `focus:border-[${colors.accent.gold}] focus:ring-2 focus:ring-[${colors.accent.gold}]/20`,
  },

  // Glass effect
  glass: {
    base: `bg-[${colors.bg.surface}]/80 backdrop-blur-xl border border-[${colors.border.default}]`,
    gold: `bg-[${colors.bg.surface}]/80 backdrop-blur-xl border border-[${colors.border.gold}]`,
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a glass morphism class string
 */
export function glass(opacity: number = 0.8, blur: number = 21): string {
  return `bg-[${colors.bg.surface}]/${Math.round(opacity * 100)} backdrop-blur-[${blur}px]`;
}

/**
 * Generate a gradient text class
 */
export function gradientText(from: string = colors.accent.gold, to: string = colors.accent.goldLight): string {
  return `bg-gradient-to-r from-[${from}] to-[${to}] bg-clip-text text-transparent`;
}

/**
 * Generate consistent card background
 */
export function cardBg(elevated: boolean = false): string {
  return elevated 
    ? `bg-[${colors.bg.elevated}] border border-[${colors.border.default}]`
    : `bg-[${colors.bg.surface}] border border-[${colors.border.default}]`;
}

// Export all design tokens as default
export const designSystem = {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  animations,
  zIndex,
  breakpoints,
  components,
} as const;

export default designSystem;
