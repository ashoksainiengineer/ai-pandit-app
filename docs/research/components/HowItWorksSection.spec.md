# HowItWorksSection Specification

## Overview
- **Target file:** `apps/web/app/page.tsx` → `HowItWorks()` component
- **Interaction model:** Click-driven accordion (select active feature)
- **Background:** #FAFAFA (var(--prism-canvas))
- **Layout:** Two-column (60% feature list + 40% sticky preview)

## DOM Structure
```
<section> (py-32, bg-[#FAFAFA])
  └── <div> (max-w-[1200px], mx-auto, px-6)
      ├── Section Header (text-center)
      │   ├── Badge ("How It Works")
      │   └── h2 ("Six stages to your true birth time")
      └── Two-column grid (grid-cols-1 lg:grid-cols-5, gap-16)
          ├── Left (lg:col-span-3) — Feature Accordion
          │   └── [3x feature items with data-number]
          │       ├── Number (left, on border)
          │       ├── Title
          │       └── Description (animated expand on active)
          └── Right (lg:col-span-2) — Sticky Preview
              └── <AnimatePresence mode="wait">
                  ├── EphemerisTable (when activeFeature === 0)
                  ├── AIThinkingBox (when activeFeature === 1)
                  └── CandidateComparisonTable (when activeFeature === 2)
```

## Computed Styles

### Numbered Item (Active)
- position: relative
- padding-left: 2rem
- padding-top: 1.5rem
- padding-bottom: 1.5rem
- padding-right: 1.5rem
- border-left: 1px solid rgba(0, 0, 0, 0.20)
- background: #FFFFFF
- border-radius: 16px (right side)
- box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04)
- cursor: pointer

### Numbered Item (Inactive)
- border-left: 1px solid rgba(0, 0, 0, 0.06)
- background: transparent
- hover: background: rgba(255, 255, 255, 0.5)

### Number Display
- position: absolute
- left: 0
- transform: translateX(-50%)
- width: 1.25rem
- text-align: center
- font-family: JetBrains Mono
- font-size: 0.75rem (12px)
- Active: color: #000000
- Inactive: color: rgba(0, 0, 0, 0.3)
- background: #FAFAFA (matches section bg, to "cut through" border)

### Title (Active)
- font-size: 1.125rem (18px)
- font-weight: 500
- color: #000000

### Title (Inactive)
- color: rgba(0, 0, 0, 0.5)

### Description (Revealed)
- font-size: 0.875rem (14px)
- line-height: 1.6
- color: rgba(0, 0, 0, 0.5)
- padding-top: 0.25rem

## States & Behaviors

### Click to Select
- **Trigger:** onClick on item div
- **State A (inactive):** Transparent bg, gray border, faded number/text
- **State B (active):** White bg, visible border, black number/text, description revealed
- **Transition:** 300ms ease

### Description Expand
- **Implementation:** AnimatePresence (Framer Motion)
- **Animation:** opacity 0→1 + height 0→auto
- **Duration:** 300ms
- **Easing:** cubic-bezier(0.215, 0.61, 0.355, 1)

### Sticky Preview (Right Column)
- **Position:** sticky, top: 8rem (below navbar)
- **Content:** Swaps based on activeFeature index
- **Transition:** AnimatePresence mode="wait" with fade+slide

## Assets
- Icons: BarChart3, Activity, Check (for left-side feature indicators)

## Text Content (Verbatim — AI Pandit)
- Section Badge: "How It Works"
- Section Heading: "Six stages to your true birth time"
- Feature 01: "Enter your birth details" / "Provide your date, approximate time, and birthplace..."
- Feature 02: "Answer physical traits" / "Share your natural body type, height, build..."
- Feature 03: "Share life events" / "Provide 3+ significant life events with dates..."

## Responsive Behavior
- **Desktop (1440px):** Two-column, sticky right panel
- **Tablet (768px):** Two-column, smaller gap
- **Mobile (390px):** Single column, right panel below, not sticky
