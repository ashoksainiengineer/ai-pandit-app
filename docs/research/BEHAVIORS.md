# Behaviors — diabrowser.com

**Source**: https://diabrowser.com
**Captured**: 2026-05-07

---

## Scroll Sweep

| Element | Trigger | Behavior | Mechanism |
|---------|---------|----------|-----------|
| Navbar background | scrollY > 0 | Transitions from transparent → white/opaque with border-bottom | CSS transition (300ms) + scroll listener |
| Navbar border | scrollY > ~20px | border-bottom appears (black/5) | Same as above |
| Hero content | Viewport entry | Fades in up (staggered: badge → heading → subtitle → CTA) | Framer Motion / CSS animation |
| Floating cards (Hero) | Viewport entry | Fade in + slide up + scale 0.95→1 (staggered delays) | Framer Motion `whileInView` |
| Numbered items (Section 3) | Scroll into view | Each item fades in with slide-left, staggered by index | IntersectionObserver or Framer Motion |
| Feature cards (Section 4) | Scroll into view | Fade in up, staggered per card | Same as above |
| Privacy section | Scroll into view | Lock icon scales in, toggle pills fade in | Framer Motion |
| CTA section | Scroll into view | Fade in | Framer Motion |

---

## Click Sweep

| Element | Action | Result |
|---------|--------|--------|
| "What's New" nav link | Click | Navigates to /release-notes/latest |
| "Security" nav link | Click | Navigates to /security |
| "Mornings" nav link | Click | Navigates to /start |
| "Download Dia" button | Click | Triggers download action |
| "Watch the trailer video" badge | Click | Opens video modal or scrolls |
| "Learn more about privacy →" | Click | Navigates to /privacy |
| Feature cards | Click | No click action (hover-only) |
| Toggle pills (Privacy) | Click | No click action (static display) |

---

## Hover Sweep

| Element | State Change | Transition |
|---------|-------------|------------|
| Nav links | color: black/60 → black | 200ms ease |
| Primary CTA button (black pill) | background: black → black/85, scale: 1 → 1.02 | 200ms ease |
| Ghost button (outline) | background: transparent → rgba(0,0,0,0.04) | 200ms ease |
| Feature cards | box-shadow: sm → md, translateY: 0 → -2px | 300ms ease |
| "Learn more" link | opacity: 1 → 0.7 | 200ms ease |
| Numbered items (inactive) | background: transparent → white/50 | 300ms ease |

---

## Responsive Sweep

| Viewport | Layout Changes |
|----------|---------------|
| Desktop (1440px) | Full grid layouts, floating cards visible, 3-column feature cards |
| Tablet (768px) | Floating cards hidden, 2-column feature grid, reduced font sizes |
| Mobile (390px) | Single column, hamburger menu, stacked cards, smaller typography |

---

## Interaction Models Summary

- **Navbar**: scroll-driven (background opacity + border), click-driven (nav links)
- **Hero**: static (no click), scroll-driven (fade animation triggers)
- **Numbered Features**: scroll-driven (fade-in animation)
- **Feature Cards**: static (no click), hover-driven (shadow lift), scroll-driven (fade-in animation)
- **Privacy**: static (no click), scroll-driven (fade-in animation)
- **CTA Footer**: static, scroll-driven (fade-in animation)

## Notes
- No smooth scroll library detected (no Lenis, no Locomotive Scroll)
- No scroll-snap detected
- Standard CSS scroll behavior
- All animations use CSS transitions + Framer Motion (React-based site)
