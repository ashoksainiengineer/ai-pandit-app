# Dia Browser — Comprehensive Design System Specification

> **Source:** https://styles.refero.design/style/b458ca1a-70f0-4f85-b745-f879a4d08457
> **Theme:** Light
> **Analyzed:** 2026-05-06

---

## 1. Design Philosophy & Aesthetic Direction

**Concept:** *Prism on white stationery — light refracts color from a nearly monochrome surface.*

The design feels like holding a blank sheet of premium stationery up to warm morning light. The page is almost entirely achromatic, but a hidden spectrum bleeds through in concentrated gradient bursts that feel like sunlight refracting through a prism's edge. The warmth comes from translucent card surfaces (white at 90% opacity) floating on a `#F8F8F8` canvas with backdrop-blur, creating frosted-glass depth without hard shadows.

**Key Differentiators:**
- Single typeface (ABC Oracle) at ultralight weights for display
- Neutral gray buttons that deliberately avoid chromatic CTAs
- Frosted-glass card surfaces as the primary depth mechanism
- Spectrum gradient as the sole chromatic accent (replacing a traditional brand color)
- No bold weights (600/700/800) anywhere in the system
- No sharp corners — minimum border-radius is 10px

---

## 2. Complete Color Palette

### 2.1 Neutral Grayscale (Primary System)

| Name | Hex | RGB | Token | Role |
|------|-----|-----|-------|------|
| **Ink Black** | `#000000` | `rgb(0, 0, 0)` | `--color-ink-black` | Primary text, headings, nav links, borders, icon fills — the sole chromatic anchor |
| **Snow** | `#ffffff` | `rgb(255, 255, 255)` | `--color-snow` | Card backgrounds (at 90% opacity), base fills, overlay surfaces |
| **Canvas** | `#f8f8f8` | `rgb(248, 248, 248)` | `--color-canvas` | Page background (`--background` token), overall canvas beneath frosted cards |
| **Fog** | `#efefef` | `rgb(239, 239, 239)` | `--color-fog` | Header background, subtle section dividers |
| **Pebble** | `#d9d9d9` | `rgb(217, 217, 217)` | `--color-pebble` | Filled button backgrounds — neutral gray, deliberate anti-CTA |
| **Graphite** | `#636363` | `rgb(99, 99, 99)` | `--color-graphite` | Body text, secondary copy, subheadings beneath display type |
| **Ash** | `#7c7c7c` | `rgb(124, 124, 124)` | `--color-ash` | Subtle borders, secondary body text |
| **Slate** | `#959595` | `rgb(149, 149, 149)` | `--color-slate` | Tertiary text, nav labels, metadata captions |
| **Steel** | `#aeaeae` | `rgb(174, 174, 174)` | `--color-steel` | Disabled states, carousel indicator dots, icon strokes |

### 2.2 Spectrum Gradient (Brand Accent)

| Name | Hex | RGB | Token | Role |
|------|-----|-----|-------|------|
| **Rose Quartz** | `#c679c4` | `rgb(198, 121, 196)` | `--color-rose-quartz` | Gradient stop — pink/mauve tone at warm edge |
| **Red Accent** | `#fa3d1d` | `rgb(250, 61, 29)` | `--color-red` | Gradient stop — red accent, available for error/emphasis |
| **Marigold** | `#ffb005` | `rgb(255, 176, 5)` | `--color-marigold` | Gradient stop — warm amber center, available as `--yellow` |
| **Lavender** | `#e1e1fe` | `rgb(225, 225, 254)` | — | Gradient stop — soft cool mid-tone |
| **Signal Blue** | `#0358f7` | `rgb(3, 88, 247)` | `--color-signal-blue` | Gradient stop — cool end, available as `--blue` for links |
| **Hot Pink** | `#fd02f5` | `rgb(253, 2, 245)` | `--color-hot-pink` | Available as `--pink` for highlight/playful accent contexts |

**Primary Spectrum Gradient CSS:**
```css
linear-gradient(90deg, rgb(198, 121, 196) 0%, rgb(250, 61, 29) 25%, rgb(255, 176, 5) 50%, rgb(225, 225, 254) 75%, rgb(3, 88, 247) 100%)
```

**Alternative 135° Gradient (for small accent dots):**
```css
linear-gradient(135deg, #c679c4, #fa3d1d)     /* warm */
linear-gradient(135deg, #ffb005, #fa3d1d)     /* amber-red */
linear-gradient(135deg, #e1e1fe, #0358f7)     /* cool */
```

### 2.3 Opacity Variants

- `--red-50%` / `--red-10%` — red accent at reduced opacity
- `--blue-50%` / `--blue-10%` — signal blue at reduced opacity
- `--pink-50%` / `--pink-10%` — hot pink at reduced opacity
- `--yellow-50%` / `--yellow-10%` — marigold at reduced opacity
- `--brown` — additional earth tone token

### 2.4 Surface Hierarchy

| Level | Name | Value | Purpose |
|-------|------|-------|---------|
| 0 | Canvas | `#f8f8f8` | Page-level background, the lightest layer |
| 1 | Header | `#efefef` | Sticky header bar with `backdrop-blur(24px)`, semi-transparent |
| 2 | Card | `rgba(255, 255, 255, 0.9)` | Primary content cards — frosted glass over gradient backgrounds |
| 3 | Button Fill | `#d9d9d9` | Filled button surfaces, slightly recessed against white cards |

---

## 3. Typography System

### 3.1 Font Family

**Primary:** `ABC Oracle`
- **Weights:** 300 (Light), 400 (Regular), 500 (Medium)
- **Sizes:** 10px, 14px, 16px, 18px, 22px, 50px, 54px, 72px
- **Line Heights:** 1.11–1.50
- **Fallback Stack:** `'ABC Oracle', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Substitutes:** GT Super Display (weight 300), DM Sans (lighter weights), Instrument Serif light, Reckless Neue light

**Rule:** The sole typeface across the entire system. Weight 300 for display is the signature — most browser/SaaS sites use 600+ for headlines, but Dia goes featherweight. **Never use weights above 500.**

### 3.2 Type Scale

| Role | Size | Weight | Line Height | Letter Spacing | Token |
|------|------|--------|-------------|----------------|-------|
| **display** | 72px | 300 | 1.11 | -2.88px (`-0.04em`) | `--text-display` |
| **heading-lg** | 54px | 300 | 1.17 | -2.16px (`-0.04em`) | `--text-heading-lg` |
| **heading** | 50px | 400 | 1.18 | -2px (`-0.04em`) | `--text-heading` |
| **heading-sm** | 22px | 400 | 1.25 | -0.44px (`-0.02em`) | `--text-heading-sm` |
| **subheading** | 18px | 400 | 1.33 | normal | `--text-subheading` |
| **body** | 16px | 400 | 1.50 | normal | `--text-body` |
| **body-sm** | 14px | 400 | 1.50 | normal | `--text-body-sm` |
| **caption** | 10px | 400 | 1.50 | normal | `--text-caption` |

### 3.3 Typography Usage Rules

| Context | Style |
|---------|-------|
| Display headlines (50px+) | Weight 300, `-0.04em` letter-spacing |
| Heading-sm (22px) | Weight 400, `-0.02em` letter-spacing |
| Body text (14-18px) | Weight 400, normal letter-spacing |
| Buttons, labels (≤16px) | Weight 500 |
| Nav links | 14px weight 400 |
| Primary text color | `#000000` |
| Secondary body text | `#636363` |
| Tertiary/metadata text | `#959595` |

---

## 4. Spacing & Shape System

### 4.1 Base Unit

**Base unit:** `8px`
**Density:** spacious

### 4.2 Spacing Scale

| Token | Value |
|-------|-------|
| `--spacing-5` | 5px |
| `--spacing-6` | 6px |
| `--spacing-10` | 10px |
| `--spacing-14` | 14px |
| `--spacing-15` | 15px |
| `--spacing-20` | 20px |
| `--spacing-24` | 24px |
| `--spacing-32` | 32px |
| `--spacing-34` | 34px |

### 4.3 Layout Spacing

| Property | Value |
|----------|-------|
| Page max-width | 1200px |
| Section gap | 80px – 120px |
| Card padding | 32px |
| Element gap | 15px – 20px |

### 4.4 Border Radius

| Element | Value | Token |
|---------|-------|-------|
| Cards | 30px | `--radius-cards` |
| Images | 10px | `--radius-images` |
| Buttons (filled) | 30px | `--radius-buttons` |
| Nav items | 16px | `--radius-navitems` |
| Containers | 40px | `--radius-containers` |
| Pill buttons (ghost/tab) | 9999px | `--radius-pillbuttons` |
| Soft fill buttons | 16px | — |

**Rule:** Never use border-radius less than 10px. The system has no sharp corners.

### 4.5 Shadows

| Name | Value | Token |
|------|-------|-------|
| sm | `rgba(0, 0, 0, 0.08) 0px 0px 8px 0px` | `--shadow-sm` |

**Rule:** This is the ONLY shadow in the system. Never add drop shadows beyond this single 8px blur shadow. Avoid layered or colored shadows.

---

## 5. Component Library

### 5.1 Frosted Content Card
**Role:** Primary content container for feature descriptions, testimonials, and product showcases

```css
background: rgba(255, 255, 255, 0.9);
backdrop-filter: blur(24px);
border-radius: 30px;
padding: 32px;
box-shadow: rgba(0, 0, 0, 0.08) 0px 0px 8px 0px;
border: none;
```
- Text inside: `#000000` headings at weight 400/500
- Body text: `#636363`
- Used for: feature cards, testimonials, product showcases

### 5.2 Neutral Filled Button
**Role:** Primary download/action button ("Download Dia")

```css
background: #d9d9d9;
color: rgba(0, 0, 0, 0.85);
border-radius: 30px;
font: 14-16px ABC Oracle weight 500;
border: none;
padding: inline content-sized;
```
- **Hover:** transitions to `#000000` background with white text
- **Transition:** `background 0.2s ease`
- No visible border

### 5.3 Ghost Pill Button
**Role:** Secondary actions and navigation toggles

```css
background: transparent;
color: rgba(0, 0, 0, 0.85);
border-radius: 9999px;
```
- Relies on text and hover state for interactivity
- Used for: category tabs (Write, Learning, Planning), secondary links

### 5.4 Soft Fill Button
**Role:** Announcement banner and contextual actions

```css
background: rgba(0, 0, 0, 0.04);
color: rgba(0, 0, 0, 0.85);
border-radius: 16px;
padding: 0 24px;
```
- Used for: header announcement bar ("Start your mornings right, with Dia reports")

### 5.5 Sticky Header Bar
**Role:** Fixed navigation with frosted glass effect

```css
background: #efefef;
backdrop-filter: blur(24px);
height: ~52px;
```
- **Left:** Dia logo
- **Center:** Nav links at 14px weight 400 `#000000`
- **Right:** announcement pill + neutral "Download Dia" button
- Nav link horizontal gaps: ~20px
- Banner pill nested inside: `border-radius: 16-20px`

### 5.6 Testimonial Card
**Role:** User quote display in horizontal carousel

- Same frosted card base as Content Card
- Quote text: 14-16px weight 400 `#000000`
- Attribution margin-top: 5px
- Avatar: circular, ~40px diameter
- Name: 14px weight 500 `#000000`
- Role: 14px weight 400 `#959595`
- Cards spaced: 20px apart
- Carousel: horizontal scrolling, edge-bleed, 5+ cards visible

### 5.7 Product Screenshot Showcase
**Role:** Feature demonstration with ambient gradient background

- Full-width section
- Spectrum gradient bleeds softly behind a contained browser mockup screenshot
- Screenshots: 10px border-radius
- Gradient: warm ambient glow at ~30% opacity beneath screenshot frame

### 5.8 Category Tab Carousel
**Role:** Horizontal dot pagination and content category switcher

- Row of oval navigation dots
- Inactive: `#aeaeae`
- Active: `#000000`
- Below the "Dia is for" heading
- Active category text: heading-sm (22px) with italic emphasis
- Transition: `0.2s ease`

### 5.9 Video Thumbnail Button
**Role:** Watch the trailer CTA overlay

- Circular avatar/thumbnail preview: ~48px
- Adjacent text label: "Watch the trailer" at 14px weight 400
- Positioned: fixed bottom-left
- No background fill — floats over content

### 5.10 Footer Navigation Grid
**Role:** Multi-column link grid in footer

- Column headers (Product, Company, etc.): 14px weight 500 `#000000`
- Links: 14px weight 400 `#636363`
- Column gap: ~20px
- Row gap: ~10px
- No decorative borders or dividers

### 5.11 Privacy/Trust Section
**Role:** Trust/privacy messaging block

- Centered layout
- Lock icon: black, ~24px
- Display heading: 50-54px weight 300 `#000000` with `-0.04em` tracking
- Body text: 16px `#636363`
- Inline link: `#000000` with underline

### 5.12 Inline Text Link
**Role:** Contextual links within body copy

```css
color: #000000;
text-decoration: underline;
```
- **Hover:** transitions `text-decoration-color` over `0.2s ease`
- No color change on hover — underline emphasis only
- Used for: "Learn more about privacy in Dia" and similar

---

## 6. Layout Patterns

### 6.1 Page Structure

- **Canvas:** `#f8f8f8` background throughout
- **Max-width:** 1200px, centered
- **No alternating background bands** — entire page stays on same canvas color
- Depth created by frosted card surfaces and gradient glows

### 6.2 Hero Section

- Centered single-column
- Subtitle: 18px weight 400 `#636363`
- Display headline: 72px weight 300 `#000000`, letter-spacing `-2.88px`
- Neutral button below headline
- Floating product UI mockup with gradient glow beneath

### 6.3 Feature Sections

- Centered stacks: heading → carousel dots → subheading → full-width screenshot showcase
- Generous vertical gaps: 80-120px between sections

### 6.4 Testimonial Section

- Horizontal scrolling card carousel
- Edge-bleed (cards extend beyond viewport edges)
- 5+ cards visible at once

### 6.5 Footer

- Multi-column link grid
- No decorative borders or dividers

### 6.6 Grid/Flex Patterns

- **Feature Card Grid:** 3-column grid of frosted cards
  - Gap: 15-20px between elements
  - Card heading: 22px weight 500 `#000000`
  - Card body: 16px weight 400 `#636363`

---

## 7. Animations & Interactions

### 7.1 Default Micro-Interaction

```css
transition: 0.2s ease;
```
**Applies to:** color, background-color, border-color, fill, stroke, opacity, text-decoration-color

**Used for:**
- Hover states on links
- Hover states on buttons
- Hover states on icons
- Button background transitions

### 7.2 Gradient Animations (Theatrical)

```css
duration: 0.85s - 0.9s;
easing: cubic-bezier(0.77, 0, 0.175, 1);
```
**Animation names:**
- `chroma-expand-bidirectional`
- `chroma-sweep`

**Modes:**
1. **Full strip** — horizontal bar, often masked to reveal only center portion
2. **Ambient glow** — diffused behind screenshots at low opacity with blur
3. **Chroma animation** — gradient sweeps or expands

### 7.3 Marquee Animation

```css
animation: diaMarqueeL;
duration: ~2040s;  /* extremely slow continuous loop */
```
- Slow-scrolling continuous loop
- No spring/bounce physics

### 7.4 Specific Hover States

| Element | Default | Hover | Transition |
|---------|---------|-------|------------|
| Neutral Filled Button | `#d9d9d9` bg, `rgba(0,0,0,0.85)` text | `#000000` bg, white text | `background 0.2s` |
| Inline Text Link | `#000000`, underline | underline color change only | `text-decoration-color 0.2s ease` |
| Ghost Pill Button | transparent bg | text/hover state interactivity | `0.2s ease` |
| Nav Links | `#000000` | color/opacity change | `0.2s ease` |
| Category Dots | `#aeaeae` | `#000000` (active) | `0.2s ease` |

### 7.5 Motion Philosophy

- **Expressive personality** — smooth curves only
- **No spring/bounce physics**
- All easing is smooth curves
- Two speed tiers: fast micro-interactions (0.2s) and slow theatrical gradient animations (0.85-0.9s)

---

## 8. Icons & Imagery Style

### 8.1 Icon Style

- **Minimal monochrome**
- Small lock icon for privacy (~24px, black)
- Dia diamond logo mark
- No icon libraries — system is text-dominant

### 8.2 Imagery

- **Product screenshots dominate** — browser UI mockups (Gmail compose, Substack editor) at realistic scale
- Screenshot border-radius: 10px
- Screenshots float over warm ambient gradient glows
- **No stock photography** for hero/feature sections
- **Only photography:** small circular avatar crops (~40px) for testimonial cards

### 8.3 Decorative Visuals

- The spectrum gradient functions as the primary decorative visual
- Horizontal chromatic band (pink → red → amber → lavender → blue)
- Bleeds into soft ambient light behind screenshot showcases
- Replaces traditional hero imagery — atmospheric rather than illustrative

---

## 9. Gradient System Details

### 9.1 Primary Spectrum Gradient

```css
/* 90° horizontal (primary) */
linear-gradient(90deg, #c679c4 0%, #fa3d1d 25%, #ffb005 50%, #e1e1fe 75%, #0358f7 100%)

/* RGB variant */
linear-gradient(90deg, rgb(198, 121, 196) 0%, rgb(250, 61, 29) 25%, rgb(255, 176, 5) 50%, rgb(225, 225, 254) 75%, rgb(3, 88, 247) 100%)
```

### 9.2 Small Accent Gradients (135°)

Used for small circular accent dots (~44px):
```css
linear-gradient(135deg, #c679c4, #fa3d1d)   /* warm */
linear-gradient(135deg, #ffb005, #fa3d1d)   /* amber-red */
linear-gradient(135deg, #e1e1fe, #0358f7)   /* cool */
```

### 9.3 Gradient Usage Rules

| Do | Don't |
|----|-------|
| Use as ambient background glow | Never use as text color |
| Use as decorative accent strip | Never use as button fill |
| Use behind screenshots at low opacity + blur | Never use saturated colors as solid backgrounds |
| Use individual stops as rare micro-accents | Never compete with content hierarchy |

---

## 10. Do's and Don'ts

### Do

- [x] Use the spectrum gradient ONLY as ambient background glow or decorative strip
- [x] Keep buttons neutral gray (`#d9d9d9`) or transparent
- [x] Apply 30px border-radius consistently to cards and filled buttons
- [x] Use 9999px pill radius only for ghost/tab buttons
- [x] Use ABC Oracle weight 300 for all display text (50px+) with `-0.04em` letter-spacing
- [x] Use weight 500 only for buttons and labels ≤16px
- [x] Apply `backdrop-filter: blur(24px)` with `rgba(255,255,255,0.9)` for elevated surfaces
- [x] Maintain `rgba(0,0,0,0.08) 0px 0px 8px 0px` shadow on all floating cards
- [x] Use `#636363` for body text and `#959595` for tertiary/metadata text

### Don't

- [ ] Never use saturated colors (`--red`, `--blue`, `--pink`, `--yellow`) as solid backgrounds or button fills
- [ ] Never use border-radius less than 10px on any element
- [ ] Never use font weights above 500 — no bold (600/700/800) anywhere
- [ ] Never add drop shadows beyond the single 8px blur shadow
- [ ] Never place dark backgrounds behind content sections
- [ ] Never use underlined links with color changes — links stay `#000000`
- [ ] Never introduce a second typeface
- [ ] Never let buttons compete with content for attention

---

## 11. CSS Custom Properties (Complete)

```css
:root {
  /* ============================================
     COLORS
     ============================================ */
  --color-ink-black: #000000;
  --color-snow: #ffffff;
  --color-canvas: #f8f8f8;
  --color-fog: #efefef;
  --color-pebble: #d9d9d9;
  --color-graphite: #636363;
  --color-slate: #959595;
  --color-steel: #aeaeae;
  --color-ash: #7c7c7c;

  /* Spectrum */
  --color-spectrum-gradient: #fa3d1d;  /* reference color */
  --gradient-spectrum-gradient: linear-gradient(90deg, rgb(198, 121, 196) 0%, rgb(250, 61, 29) 25%, rgb(255, 176, 5) 50%, rgb(225, 225, 254) 75%, rgb(3, 88, 247) 100%);
  --color-rose-quartz: #c679c4;
  --color-marigold: #ffb005;
  --color-signal-blue: #0358f7;
  --color-hot-pink: #fd02f5;

  /* ============================================
     TYPOGRAPHY — FONT FAMILIES
     ============================================ */
  --font-abc-oracle: 'ABC Oracle', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  /* ============================================
     TYPOGRAPHY — SCALE
     ============================================ */
  --text-caption: 10px;
  --leading-caption: 1.5;

  --text-body-sm: 14px;
  --leading-body-sm: 1.5;

  --text-body: 16px;
  --leading-body: 1.5;

  --text-subheading: 18px;
  --leading-subheading: 1.33;

  --text-heading-sm: 22px;
  --leading-heading-sm: 1.25;
  --tracking-heading-sm: -0.44px;

  --text-heading: 50px;
  --leading-heading: 1.18;
  --tracking-heading: -2px;

  --text-heading-lg: 54px;
  --leading-heading-lg: 1.17;
  --tracking-heading-lg: -2.16px;

  --text-display: 72px;
  --leading-display: 1.11;
  --tracking-display: -2.88px;

  /* ============================================
     TYPOGRAPHY — WEIGHTS
     ============================================ */
  --font-weight-light: 300;
  --font-weight-regular: 400;
  --font-weight-medium: 500;

  /* ============================================
     SPACING
     ============================================ */
  --spacing-unit: 8px;
  --spacing-5: 5px;
  --spacing-6: 6px;
  --spacing-10: 10px;
  --spacing-14: 14px;
  --spacing-15: 15px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-34: 34px;

  /* ============================================
     LAYOUT
     ============================================ */
  --page-max-width: 1200px;
  --section-gap: 80px;   /* to 120px */
  --card-padding: 32px;
  --element-gap: 15px;   /* to 20px */

  /* ============================================
     BORDER RADIUS
     ============================================ */
  --radius-lg: 10px;
  --radius-2xl: 16px;
  --radius-2xl-2: 20px;
  --radius-3xl: 30px;
  --radius-3xl-2: 40px;
  --radius-full: 9999px;

  /* Named Radii */
  --radius-cards: 30px;
  --radius-images: 10px;
  --radius-buttons: 30px;
  --radius-navitems: 16px;
  --radius-containers: 40px;
  --radius-pillbuttons: 9999px;

  /* ============================================
     SHADOWS
     ============================================ */
  --shadow-sm: rgba(0, 0, 0, 0.08) 0px 0px 8px 0px;

  /* ============================================
     SURFACES
     ============================================ */
  --surface-canvas: #f8f8f8;
  --surface-header: #efefef;
  --surface-card: rgba(255, 255, 255, 0.9);
  --surface-button-fill: #d9d9d9;
}
```

---

## 12. Tailwind v4 Configuration

```css
@theme {
  /* Colors */
  --color-ink-black: #000000;
  --color-snow: #ffffff;
  --color-canvas: #f8f8f8;
  --color-fog: #efefef;
  --color-pebble: #d9d9d9;
  --color-graphite: #636363;
  --color-slate: #959595;
  --color-steel: #aeaeae;
  --color-ash: #7c7c7c;
  --color-spectrum-gradient: #fa3d1d;
  --color-rose-quartz: #c679c4;
  --color-marigold: #ffb005;
  --color-signal-blue: #0358f7;
  --color-hot-pink: #fd02f5;

  /* Typography */
  --font-abc-oracle: 'ABC Oracle', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  --text-caption: 10px;
  --leading-caption: 1.5;
  --text-body-sm: 14px;
  --leading-body-sm: 1.5;
  --text-body: 16px;
  --leading-body: 1.5;
  --text-subheading: 18px;
  --leading-subheading: 1.33;
  --text-heading-sm: 22px;
  --leading-heading-sm: 1.25;
  --tracking-heading-sm: -0.44px;
  --text-heading: 50px;
  --leading-heading: 1.18;
  --tracking-heading: -2px;
  --text-heading-lg: 54px;
  --leading-heading-lg: 1.17;
  --tracking-heading-lg: -2.16px;
  --text-display: 72px;
  --leading-display: 1.11;
  --tracking-display: -2.88px;

  /* Spacing */
  --spacing-5: 5px;
  --spacing-6: 6px;
  --spacing-10: 10px;
  --spacing-14: 14px;
  --spacing-15: 15px;
  --spacing-20: 20px;
  --spacing-24: 24px;
  --spacing-32: 32px;
  --spacing-34: 34px;

  /* Border Radius */
  --radius-lg: 10px;
  --radius-2xl: 16px;
  --radius-2xl-2: 20px;
  --radius-3xl: 30px;
  --radius-3xl-2: 40px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: rgba(0, 0, 0, 0.08) 0px 0px 8px 0px;
}
```

---

## 13. Example Component Prompts

### 13.1 Hero Section

```
#F8F8F8 background. Centered subtitle at 18px ABC Oracle weight 400, #636363.
Display headline at 72px weight 300, #000000, letter-spacing -2.88px, line-height 1.11.
Below: neutral button #D9D9D9 background, #000000 text, 30px radius, 14px weight 500.
Below button: product UI mockup with 10px radius, spectrum gradient glow
(low opacity, blurred) behind it.
```

### 13.2 Feature Card Grid

```
3-column grid of frosted cards — background rgba(255,255,255,0.9),
backdrop-filter blur(24px), 30px radius, 32px padding,
shadow rgba(0,0,0,0.08) 0px 0px 8px 0px.
Card heading 22px weight 500 #000000, body 16px weight 400 #636363,
15px gap between elements.
```

### 13.3 Testimonial Carousel

```
Horizontal scroll of frosted cards (same card styling as above).
Each card: quote text 14px weight 400 #000000, 5px margin above attribution.
Avatar 40px circle, name 14px weight 500 #000000, role 14px weight 400 #959595.
Cards spaced 20px apart.
```

### 13.4 Sticky Navigation Bar

```
Background #EFEFEF with backdrop-filter blur(24px). Height ~52px.
Logo left. Nav links 14px weight 400 #000000, 20px horizontal gaps.
Right side: announcement pill (rgba(0,0,0,0.04) background, 16px radius,
24px horizontal padding, 14px text), neutral Download button (#D9D9D9, 30px radius).
```

### 13.5 Privacy/Trust Section

```
Centered layout. Icon (lock) at 24px, black.
Headline 54px weight 300 #000000, letter-spacing -2.16px.
Body text 16px weight 400 #636363.
Inline link: #000000 with underline, hover transitions text-decoration-color 0.2s ease.
```

---

## 14. Similar Brand References

| Brand | Shared Characteristics |
|-------|----------------------|
| **Arc Browser** | Same parent company, spectrum gradient DNA, single-font lightweight typography |
| **Linear** | Single typeface at ultralight weights, monochrome UI with one accent gradient, frosted-glass cards |
| **Raycast** | Predominantly monochrome palette, product screenshot-driven features, pill-radius buttons, ambient gradient accents |
| **Notion** | Near-achromatic design, gray buttons that don't shout, content hierarchy from typography weight alone |
| **Perplexity** | Light canvas, neutral-fill action buttons, single sans-serif typeface, restrained color in small accent moments |

---

*This specification was generated by exhaustive analysis of the Refero Styles design reference page for Dia Browser. All color values, typography scales, spacing tokens, and component definitions are extracted directly from the source.*
