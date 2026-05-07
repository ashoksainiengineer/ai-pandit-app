# CTASection Specification

## Overview
- **Target file:** `apps/web/app/page.tsx` → `CTA()` component
- **Interaction model:** Static, scroll-driven fade-in
- **Background:** White (#FFFFFF)
- **Layout:** Centered, max-w-[800px]

## DOM Structure
```
<section> (py-32, bg-white)
  └── <div> (max-w-[800px], mx-auto, px-6, text-center)
      ├── h2: "Ready for a better birth time?" (text-4xl md:text-5xl lg:text-6xl, font-light)
      ├── <Link> (.app-btn — black pill button)
      │   ├── "Start Your Analysis"
      │   └── <ArrowRight> (group-hover:translate-x-1)
      └── p: "Free analysis. No credit card required." (text-black/30, text-sm)
```

## Computed Styles

### Heading
- font-family: DM Sans
- font-weight: 300 (light)
- font-size: 3.125rem (50px) / lg: 3.75rem (60px)
- line-height: 1.11
- letter-spacing: -0.04em
- color: #000000
- margin-bottom: 2rem (mb-8)

### CTA Button (.app-btn)
- display: inline-flex
- align-items: center
- justify-content: center
- gap: 0.625rem (10px)
- background: #000000
- color: #FFFFFF
- border-radius: 9999px
- padding: 1rem 2.5rem (px-10 py-5)
- font-family: DM Sans
- font-size: 1.125rem (18px)
- font-weight: 500
- transition: all 200ms ease
- margin-bottom: 1.5rem

### CTA Button Hover
- background: rgba(0, 0, 0, 0.85)
- icon: translateX(4px)

### Subtext
- font-size: 0.875rem (14px)
- color: rgba(0, 0, 0, 0.3)

## States & Behaviors
- **Scroll entrance:** Fade in (opacity 0→1)
- **Button hover:** Background darkens + arrow slides right
- **No click animation beyond default**

## Text Content (Verbatim — AI Pandit)
- Heading: "Ready for a better birth time?"
- CTA: "Start Your Analysis" (href="/rectify")
- Subtext: "Free analysis. No credit card required."
