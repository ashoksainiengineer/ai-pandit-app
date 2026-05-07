# HeroSection Specification

## Overview
- **Target file:** `apps/web/app/page.tsx` → `Hero()` component
- **Interaction model:** Static display, scroll-driven fade-in animation
- **Background:** Blue mesh gradient with noise texture overlay

## DOM Structure
```
<section> (.app-hero-gradient .min-h-[90vh])
  ├── Noise overlay (absolute, inset-0, opacity-[0.025])
  ├── Decorative blobs (absolute, rounded-full, blur-[80-120px], blue tones)
  ├── Floating UI cards (4x, absolute positioned, staggered entrance)
  │   ├── Card 1: Dasha Analysis (top-left)
  │   ├── Card 2: Transit Check (top-right)
  │   ├── Card 3: 97% Confidence (bottom-left)
  │   └── Card 4: Birth Chart (bottom-right)
  ├── Hero Content (z-10, centered)
  │   ├── Badge pill ("Vedic Birth Time Rectification")
  │   ├── Animated heading h1
  │   │   ├── "Your " (font-light)
  │   │   ├── "birth time" (font-medium)
  │   │   ├── ", with divine " (font-light)
  │   │   └── <AnimatePresence> word cycling ("precision"/"accuracy"/"clarity")
  │   ├── Subtitle p (text-lg, text-black/50)
  │   ├── CTA buttons
  │   │   ├── "Start Your Analysis" (.app-btn: black pill, rounded-full)
  │   │   └── "See how it works" (text-black/60 with ChevronDown)
  │   └── Stats bar (3 stats with icons)
  └── Scroll indicator (bouncing dot in rounded-full container)
```

## Computed Styles

### Section Container
- min-height: 90vh
- background: linear-gradient(180deg, #a8c4e8 0%, #b8d3ee 60%, #c8ddf5 100%)
- overflow: hidden
- position: relative
- display: flex
- align-items: center
- justify-content: center

### Main Heading (h1)
- font-family: DM Sans
- font-size: 4.5rem (72px)
- font-weight: 300 (light)
- line-height: 1.11
- letter-spacing: -0.04em
- color: #000000

### Subtitle (p)
- font-family: DM Sans
- font-size: 1.125rem (18px)
- line-height: 1.6
- color: rgba(0, 0, 0, 0.5)
- max-width: 42rem
- text-align: center

### Primary CTA Button (.app-btn)
- display: inline-flex
- align-items: center
- justify-content: center
- gap: 0.625rem
- background: #000000
- color: #FFFFFF
- border-radius: 9999px
- padding: 0.875rem 1.75rem
- font-family: DM Sans
- font-size: 0.9375rem (15px)
- font-weight: 500
- border: none
- cursor: pointer
- transition: background 0.2s ease, transform 0.15s ease

### Primary CTA Button Hover
- background: rgba(0, 0, 0, 0.85)
- transform: scale(1.02)

### Floating Cards
- background: rgba(255, 255, 255, 0.9)
- backdrop-filter: blur(24px)
- border-radius: 16px (1rem)
- padding: 1rem 1.25rem
- box-shadow: 0 12px 48px rgba(0, 0, 0, 0.10)
- border: 1px solid rgba(0, 0, 0, 0.08)

### Badge Pill
- display: inline-flex
- align-items: center
- gap: 0.5rem
- padding: 0.5rem 1rem
- background: rgba(255, 255, 255, 0.8)
- backdrop-filter: blur(12px)
- border: 1px solid rgba(0, 0, 0, 0.05)
- border-radius: 9999px
- font-size: 0.75rem
- font-weight: 500
- color: rgba(0, 0, 0, 0.6)
- text-transform: uppercase
- letter-spacing: 0.05em

### Stats Bar Items
- display: flex
- align-items: center
- gap: 0.75rem
- font-size: 1.125rem (18px) for value
- font-size: 0.875rem (14px) for label
- color: rgba(0, 0, 0, 0.4) for label

## States & Behaviors

### Animated Word Cycling
- **Trigger:** setInterval (every 3000ms)
- **Animation:** AnimatePresence with fade + blur transition
- **Words:** ["precision", "accuracy", "clarity"]
- **Duration:** 300ms per transition
- **Implementation:** useState + useEffect + AnimatePresence (Framer Motion)

### Floating Cards Entrance
- **Trigger:** Component mount
- **Animation:** Fade in up + scale (0.95 → 1)
- **Stagger:** 0.3s, 0.5s, 0.7s, 0.9s delays
- **Easing:** cubic-bezier(0.16, 1, 0.3, 1)
- **Duration:** 0.7s per card

### Scroll Indicator
- **Trigger:** Continuous
- **Animation:** translateY(0 → 8 → 0), 2s infinite
- **Container:** w-6 h-10, border-2 rounded-full, border-black/20

## Assets
- No external images (uses Lucide icons + emoji)
- Icons: Moon, Activity, Star, Calendar, Timer, BarChart3, ArrowRight, ChevronDown
- Noise texture: SVG data URI (fractalNoise filter, opacity 0.025)

## Text Content (Verbatim — AI Pandit)
- Badge: "Vedic Birth Time Rectification"
- Heading: "Your birth time, with divine [precision/accuracy/clarity]"
- Subtitle: "AI-powered birth time rectification within seconds-level precision."
- CTA Primary: "Start Your Analysis"
- CTA Secondary: "See how it works"
- Stat 1: "Seconds" / "Precision"
- Stat 2: "6" / "Stage Pipeline"
- Stat 3: "NASA JPL" / "Ephemeris Data"

## Responsive Behavior
- **Desktop (1440px):** Full layout, floating cards visible, 4.5rem heading
- **Tablet (768px):** Floating cards hidden (hidden lg:block), 3.2rem heading
- **Mobile (390px):** Stack layout, 2.5rem heading, CTA buttons stacked (flex-col)
