# PrivacySection Specification

## Overview
- **Target file:** `apps/web/app/page.tsx` → `Privacy()` component
- **Interaction model:** Static display, scroll-driven scale-in animation on lock icon
- **Background:** #FAFAFA (var(--prism-canvas))
- **Layout:** Centered, max-w-[800px]

## DOM Structure
```
<section> (py-32, bg-[#FAFAFA])
  └── <div> (max-w-[800px], mx-auto, px-6, text-center)
      └── <div> (inline-block, p-12, rounded-3xl, border-2 border-dashed border-black/10)
          ├── Lock Icon (scale-in animation)
          │   └── <div> (w-16 h-16, rounded-2xl, bg-black/5)
          │       └── <LockIcon> (w-8 h-8, text-black/40)
          ├── h2: "Privacy first" (text-4xl md:text-5xl, font-light)
          ├── p: "with you in control" (text-2xl md:text-3xl, font-light, text-black/30)
          ├── Toggle Pills (flex flex-wrap justify-center gap-3)
          │   └── [5x pills with On/Off state]
          │       ├── Active: bg-black text-white
          │       └── Inactive: bg-black/5 text-black/40
          ├── Description (text-black/40, max-w-md)
          └── "Learn more about privacy →" (pill link, bg-black/5)
```

## Computed Styles

### Toggle Pill (Active)
- background: #000000
- color: #FFFFFF
- border-radius: 9999px
- padding: 0.5rem 1rem
- font-size: 0.875rem
- font-weight: 500

### Toggle Pill (Inactive)
- background: rgba(0, 0, 0, 0.05)
- color: rgba(0, 0, 0, 0.4)
- Same padding/radius

### Dot Indicator
- width: 0.5rem / height: 0.5rem
- border-radius: 9999px
- Active: bg-white/60
- Inactive: bg-black/15

### Lock Icon Container
- position: relative
- width: 4rem / height: 4rem
- border-radius: 16px
- background: rgba(0, 0, 0, 0.05)

## States & Behaviors

### Lock Icon Entrance
- **Trigger:** whileInView (viewport once)
- **Animation:** scale 0 → 1
- **Duration:** 500ms
- **Easing:** cubic-bezier(0.16, 1, 0.3, 1)

### Learn More Link
- **Hover:** background: rgba(0, 0, 0, 0.08) → rgba(0, 0, 0, 0.12)
- **Transition:** 300ms

## Text Content (Verbatim — AI Pandit)
- Heading: "Privacy first"
- Subheading: "with you in control"
- Pill 1: "Encrypt birth data" (On)
- Pill 2: "Auto-delete sessions" (Off)
- Pill 3: "Anonymous analysis" (On)
- Pill 4: "No data sharing" (On)
- Pill 5: "Export your data" (Off)
- Description: "Your birth data is encrypted with AES-256-GCM before it leaves your browser..."
- Link: "Learn more about privacy →" (href="/privacy")
