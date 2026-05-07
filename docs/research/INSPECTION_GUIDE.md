# INSPECTION_GUIDE.md — AI Pandit Visual Redesign

**Target Site**: https://diabrowser.com  
**Our App**: AI Pandit (Next.js 15, apps/web)  
**Goal**: Match diabrowser.com visual aesthetic, preserve all existing AI Pandit content  
**Constraint**: Zero "dia" references in code

---

## Design System Reference

### Extracted from diabrowser.com (via getComputedStyle + CSS analysis)

**Color Palette:**
- Canvas: #F8F8F8
- Snow/White: #FFFFFF
- Ink (primary text): #000000
- Ink-muted: rgba(0,0,0,0.6)
- Ink-subtle: rgba(0,0,0,0.4)
- Ink-faint: rgba(0,0,0,0.15)
- Border: rgba(0,0,0,0.08)
- Border-strong: rgba(0,0,0,0.12)
- Card bg: #FFFFFF
- Hero gradient: #a8c4e8 → #b8d3ee → #c8ddf5 (blue mesh)
- Surface-button: #D9D9D9 (pebble — secondary buttons)
- Spectrum accents: rose-quartz(#C679C4), crimson(#FA3D1D), marigold(#FFB005), lavender(#E1E1FE), signal-blue(#0358F7), hot-pink(#FD02F5)

**Typography:**
- Primary: DM Sans (weights 300, 400, 500, 600, 700)
- Mono: JetBrains Mono (weights 400, 500)
- Heading tracking: -0.04em
- Heading line-height: 1.11
- Body line-height: 1.5

**Spacing Scale:**
- Section gap: 120px (7.5rem)
- Section gap-sm: 80px (5rem)
- Page max-width: 1200px
- Page padding: 1.5rem (24px)

**Border Radius:**
- Sm: 10px (images)
- Md: 16px (nav items, pills)
- Lg: 20px (cards, containers)
- Xl: 30px (large cards, buttons)
- 2xl: 40px (large containers)
- Full: 9999px (pills, avatars, CTA buttons)

**Shadows:**
- Sm: 0 2px 8px rgba(0,0,0,0.04)
- Md: 0 4px 24px rgba(0,0,0,0.06)
- Lg: 0 8px 40px rgba(0,0,0,0.08)
- Float: 0 12px 48px rgba(0,0,0,0.10)

**Glass Effects:**
- Standard: bg-white/65, backdrop-blur-[40px], saturate-180
- Strong: bg-white/80, backdrop-blur-[60px], saturate-200
- Subtle: bg-white/50, backdrop-blur-[24px], saturate-150

**Animations:**
- Float: translateY(0) → translateY(-16px), 6s infinite
- Mesh-shift: translate + scale, 20s infinite
- Blob-morph: border-radius rotation, 8s infinite
- Fade-in-up: opacity 0→1, translateY(20px)→0, 0.5s

---

## Implementation Map

| diabrowser.com Pattern | AI Pandit Implementation |
|------------------------|--------------------------|
| Blue mesh gradient hero | `.app-hero-gradient` class (in prism-design-system.css) |
| Black pill CTA buttons | `.app-btn` class (bg-black, text-white, rounded-full) |
| Frosted glass cards | `.app-card` / `.glass` classes |
| Numbered items with left border | `.app-numbered-item` class with `data-number` attribute |
| Feature card grid | `.app-card-sm` class, white bg, subtle border |
| Privacy toggle pills | `bg-black text-white` (active), `bg-black/5 text-black/40` (inactive) |
| Sticky header with dynamic border | `.prism-header` class, scroll-driven border |
| Noise texture overlay | SVG fractal noise via data URI |

---

## Content Preservation Map

| AI Pandit Content | Maps To diabrowser.com Pattern |
|-------------------|-------------------------------|
| "Your birth time, with divine precision" | Hero animated heading (word cycling on "precision") |
| "AI-powered birth time rectification..." | Hero subtitle |
| "Start Your Analysis" | Black pill CTA (matches "Download Dia") |
| "Seconds Precision" / "6 Stage Pipeline" / "NASA JPL" | Hero stats bar |
| "Six stages to your true birth time" | Numbered items section heading |
| 01/02/03 explainer items | Numbered items with left border |
| 6 product feature cards | Feature card grid |
| Privacy toggle pills | Privacy section toggles |
| "Ready for a better birth time?" | CTA footer heading |
