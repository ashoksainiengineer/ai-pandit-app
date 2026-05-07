# Navbar Specification

## Overview
- **Target file:** `apps/web/components/Navbar.tsx`
- **Interaction model:** Scroll-driven (background opacity + border), click-driven (nav links, mobile drawer)
- **Position:** Fixed, top-0, z-[100]

## DOM Structure
```
<nav> (fixed, top-0, w-full, z-[100], h-[3.5rem])
  └── <div> (max-w-[1200px], mx-auto, px-6, h-full, flex, items-center, justify-between)
      ├── Logo (flex-1)
      │   ├── "ॐ" icon (w-7 h-7, bg-black, rounded-lg)
      │   └── "AI Pandit" text (text-lg, font-medium, tracking-[-0.02em])
      ├── Desktop Nav Links (hidden md:flex, gap-8)
      │   ├── "How It Works" (href="/#how-it-works")
      │   └── "Features" (href="/#features")
      ├── Desktop CTA (hidden md:flex, flex-1, justify-end, gap-3)
      │   ├── [Signed In]
      │   │   ├── <Link href="/dashboard"> Dashboard (.app-btn) </Link>
      │   │   └── <UserButton> (border, rounded-full, p-0.5)
      │   └── [Not Signed In]
      │       ├── <Link href="/sign-in"> Sign In (ghost) </Link>
      │       └── <Link href="/rectify"> Start Analysis (.app-btn) </Link>
      └── Mobile (md:hidden)
          ├── <UserButton> (if signed in)
          └── Hamburger button → Mobile Drawer
```

## Computed Styles

### Nav Container
- position: fixed
- top: 0
- width: 100%
- z-index: 100
- height: 3.5rem (56px)
- background: rgba(255, 255, 255, 0.8)
- backdrop-filter: blur(24px) saturate(180%)
- border-bottom: 1px solid transparent → black/5 (on scroll)
- transition: all 300ms ease

### Nav Links (Desktop)
- font-size: 0.875rem (14px)
- font-weight: 500
- color: rgba(0, 0, 0, 0.6)
- transition: color 300ms ease
- hover: color: #000000

### CTA Button (.app-btn variant)
- background: #000000
- color: #FFFFFF
- border-radius: 9999px
- padding: 0.5rem 1.25rem
- font-size: 0.875rem
- font-weight: 500
- hover: background: rgba(0, 0, 0, 0.85)

### Mobile Drawer
- background: #FFFFFF
- border-radius: 24px
- box-shadow: 0 8px 40px rgba(0, 0, 0, 0.08)
- border: 1px solid rgba(0, 0, 0, 0.05)

## States & Behaviors

### Scroll-Driven Background
- **Trigger:** window.scrollY > 0
- **State A (top):** bg-white/80, border-transparent
- **State B (scrolled > 50px):** bg-white/80, border-black/5, shadow-sm
- **Transition:** 300ms

### Mobile Drawer
- **Trigger:** Click hamburger
- **Animation:** Slide down + fade in
- **Close:** Click X, click link, or click outside

## Text Content (Verbatim — AI Pandit)
- Brand: "AI Pandit" with "ॐ" icon
- Nav Link 1: "How It Works" (href="/#how-it-works")
- Nav Link 2: "Features" (href="/#features")
- Signed In CTA: "Dashboard"
- Signed Out CTA: "Sign In" / "Start Analysis"

## Responsive Behavior
- Desktop (≥768px): Horizontal nav links + CTA
- Mobile (<768px): Hamburger → Drawer
