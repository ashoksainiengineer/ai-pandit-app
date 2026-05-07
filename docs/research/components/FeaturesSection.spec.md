# FeaturesSection Specification

## Overview
- **Target file:** `apps/web/app/page.tsx` → `Features()` component
- **Interaction model:** Static cards, hover-driven shadow lift, scroll-driven fade-in
- **Background:** White (#FFFFFF)
- **Layout:** 2x3 card grid

## DOM Structure
```
<section> (bg-white, py-32)
  └── <div> (max-w-[1200px], mx-auto, px-6)
      ├── Section Header (text-center, mb-20)
      │   ├── Badge ("Features")
      │   └── h2 ("Powered by ancient wisdom & modern AI")
      └── Grid (grid-cols-1 md:grid-cols-2, gap-6)
          └── [6x feature cards]
              ├── Tag pill (bg-black/5, text-black/50, uppercase)
              ├── Icon circle (bg-black/5, icon text-black/40)
              ├── Title (text-2xl font-medium)
              └── Description (text-black/50)
```

## Computed Styles

### Feature Card
- background: #FFFFFF
- border: 1px solid rgba(0, 0, 0, 0.05)
- border-radius: 20px
- padding: 2rem
- transition: box-shadow 300ms, transform 300ms

### Feature Card Hover
- box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06)
- transform: translateY(-2px)

### Tag Pill
- display: inline-flex
- padding: 0.375rem 0.75rem
- background: rgba(0, 0, 0, 0.05)
- color: rgba(0, 0, 0, 0.5)
- border-radius: 9999px
- font-size: 0.75rem
- font-weight: 500
- text-transform: uppercase
- letter-spacing: 0.05em

### Icon Circle
- width: 3rem / height: 3rem
- background: rgba(0, 0, 0, 0.05)
- border-radius: 16px

### Title
- font-size: 1.5rem (24px)
- font-weight: 500
- color: #000000

### Description
- font-size: 1rem (16px)
- line-height: 1.6
- color: rgba(0, 0, 0, 0.5)

### Section Heading (h2)
- font-weight: 300
- font-size: 3.125rem (50px)
- line-height: 1.11
- letter-spacing: -0.04em

## States & Behaviors
- **Hover:** Shadow lifts + translateY(-2px)
- **Scroll entrance:** Fade in up, staggered 0.08s per card
- **NO colored gradients on hover** (removed from original)

## Text Content (Verbatim — AI Pandit)
- Section Badge: "Features"
- Heading: "Powered by ancient wisdom & modern AI"
- Card 1: "Analysis" / "Reports" / "Generate comprehensive astrological reports..."
- Card 2: "Real-time" / "Live Work" / "Watch your birth time rectification unfold live..."
- Card 3: "Validation" / "Multi-Method Validation" / "Cross-validate with Dasha, Transit..."
- Card 4: "Security" / "End-to-End Encryption" / "Your birth data is encrypted with AES-256-GCM..."
- Card 5: "Precision" / "Splits" / "Compare multiple candidate birth times side-by-side..."
- Card 6: "Organization" / "Session Dashboard" / "Manage all your birth time analyses..."

## Responsive Behavior
- Desktop: 2 columns
- Mobile: 1 column
