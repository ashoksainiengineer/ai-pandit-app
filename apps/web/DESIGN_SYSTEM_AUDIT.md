# AI Pandit — Design System Audit Report

## Executive Summary

The `apps/web` codebase already has a **sophisticated and partially implemented** design system heavily inspired by **diabrowser.com** styling. The project uses a hybrid approach:
- **Tailwind CSS v3.4.4** with extensive custom extensions (colors, spacing, typography, animations)
- **Two parallel CSS systems**: `globals.css` (Dia Browser tokens) + `prism-design-system.css` (Prism tokens)
- **DM Sans** as the sole typeface (weights 300/400/500 only) via `next/font/google`
- **Framer Motion** for animations
- **Lucide React** for icons

The design system is already well-defined in config, but **application is inconsistent** across pages — some use Dia tokens, some use Prism tokens, some use hardcoded values.

---

## 1. Page Files (page.tsx) — Complete Inventory

| # | File Path | Description | Design System Used |
|---|-----------|-------------|-------------------|
| 1 | `app/page.tsx` | **Landing page** — Hero, How It Works, Tech Stack, Features, FAQ, CTA, Footer (all inline) | Dia Browser + Prism hybrid |
| 2 | `app/dashboard/page.tsx` | **User dashboard** — Lists BTR sessions, server component with Suspense | Dia Browser (`bg-dia-bg`, `dia-card`, `dia-btn`) |
| 3 | `app/rectify/page.tsx` | **BTR form wizard** — 4-step form (birth data → traits → life events → review) | Dia + Prism hybrid |
| 4 | `app/rectify/[id]/page.tsx` | **Live analysis stream** — SSE-powered real-time BTR progress viewer | Prism (`bg-prism-canvas`, hardcoded hex values) |
| 5 | `app/rectify/[id]/edit/page.tsx` | **Edit session** — Server component that decrypts and loads session data for editing | Prism |
| 6 | `app/rectify/[id]/results/page.tsx` | **Results dashboard** — Final BTR results with charts and reasoning | Prism |
| 7 | `app/debug-analysis/[id]/page.tsx` | **Debug analysis view** — Enhanced analysis page with dev tools, stage breakdown, candidate leaderboard | Hardcoded theme object (`THEME = { bg: '#f8f8f8', ... }`) |
| 8 | `app/prism-showcase/page.tsx` | **Design system showcase** — Demo page for all Prism components (Hero, Features, Pricing, Testimonials, Buttons, Cards, Inputs, Badges) | Prism design system |
| 9 | `app/admin/dashboard/page.tsx` | **Admin dashboard** — Stats cards, charts (Recharts), recent readings table | Prism (`text-prism-ink`, `bg-prism-fog`) |
| 10 | `app/sign-in/[[...rest]]/page.tsx` | **Clerk sign-in** — Authentication page with Clerk `<SignIn>` component | Prism (`bg-prism-canvas`) |
| 11 | `app/sign-up/[[...rest]]/page.tsx` | **Clerk sign-up** — Registration page with heavily customized Clerk appearance | Prism + hardcoded hex values |
| 12 | `app/terms/page.tsx` | **Terms of Service** — Legal page with sections for AI consent, privacy, liability | Dia Browser (`bg-dia-bg`, `rounded-dia-xl`) |
| 13 | `app/privacy/page.tsx` | **Privacy Policy** — Comprehensive data protection info with tables | Dia Browser (`bg-dia-bg`, `rounded-dia-xl`) |
| 14 | `app/test-auth/page.tsx` | **Test auth page** — Simple `<SignIn>` wrapper for testing | Prism |

### Key Observation
The landing page (`app/page.tsx`) is a **self-contained mega-component** (~900 lines) with all sections (Header, Hero, HowItWorks, TechStack, Features, FAQ, CTA, Footer) defined inline. It does NOT use the shared `Navbar` or `Footer` components.

---

## 2. Shared Components — Complete Inventory

### Root Level (`components/`)

| Component | File | Purpose | Design System |
|-----------|------|---------|---------------|
| **Navbar** | `components/Navbar.tsx` | Fixed top nav with scroll-aware glassmorphism, mobile hamburger menu, Clerk auth | Prism (`prism-canvas`, `prism-snow`, `prism-pebble`) |
| **Footer** | `components/Footer.tsx` | 5-column footer with brand, product/company/legal links | Hardcoded hex (`#ffffff`, `#636363`, `#000000`) |
| **Layout** | `components/Layout.tsx` | Shared page wrapper with Navbar/Footer, bg-dia-bg, centered layout variant | Dia Browser (`bg-dia-bg`, `text-dia-ink`) |

### UI Primitives (`components/ui/`)

| Component | Purpose |
|-----------|---------|
| **Button.tsx** | 4 variants: primary (black), secondary (border), ghost, destructive. Uses Prism classes |
| **Breadcrumbs.tsx** | Nav breadcrumb with predefined paths |
| **ClientOnly.tsx** | Hydration-safe client-only renderer |
| **ErrorFallback.tsx** | Generic error boundary fallback |
| **LoadingOverlay.tsx** | Full-screen loading spinner |
| **Modal.tsx** | Dialog/modal with overlay, header, footer |
| **ModalHeader.tsx** / **ModalFooter.tsx** / **ModalOverlay.tsx** | Modal sub-components |

### Form Components (`components/ui/form/`)

| Component | Purpose |
|-----------|---------|
| **FormCard.tsx** | Styled card container for form sections (3 variants: default, highlighted, subtle) |
| **FormField.tsx** | Wrapper for form inputs with label, error, helper text |
| **FormLabel.tsx** | Styled label component |
| **FormError.tsx** | Error message display |
| **types.ts** | Shared form type definitions |

### Landing Page Components (`components/landing/`)

| Component | Purpose |
|-----------|---------|
| **Navbar.tsx** | Landing-specific navbar (separate from shared Navbar) |
| **Hero.tsx** | Hero section with animated elements |
| **HowItWorks.tsx** | Step-by-step explanation |
| **Features.tsx** | Feature grid with icons |
| **TechStack.tsx** | Technology stack display |
| **Testimonials.tsx** | User testimonials |
| **Pricing.tsx** | Pricing plans |
| **FAQ.tsx** | Frequently asked questions |
| **FinalCTA.tsx** | Call-to-action section |
| **Footer.tsx** | Landing-specific footer |
| **AIThinkingBox.tsx** | Animated AI reasoning display |
| **EphemerisTable.tsx** | Planetary positions table |
| **CandidateComparisonTable.tsx** | BTR candidate comparison |
| **AccuracyShowcase.tsx** | Precision demonstration |
| **Problem.tsx** / **Solution.tsx** | Problem/solution narrative |
| **WhyTrustUs.tsx** | Trust signals |

### Rectify/BTR Components (`components/rectify/`)

| Component | Purpose |
|-----------|---------|
| **BirthDataForm.tsx** | Step 1: Birth details input form |
| **Step2PhysicalTraits.tsx** | Step 2: Physical trait questionnaire |
| **LifeEventsEditor.tsx** | Step 3: Life events input |
| **Step4Review.tsx** | Step 4: Review and submit |
| **RectifySubmitBar.tsx** | Bottom navigation bar for wizard |
| **RectifyPageSkeleton.tsx** | Loading skeleton for rectify page |
| **AutoSaveIndicator.tsx** | Cloud save status indicator |
| **TrustFooter.tsx** | Security/trust badges footer |
| **AnalysisErrorBoundary.tsx** | Error boundary for analysis flow |
| **BirthPlacePicker.tsx** | Location search with OpenStreetMap |
| **ForensicQuizEngine.tsx** | Interactive forensic trait quiz |
| **PlanetaryVitals.tsx** | Planetary position display |
| **EphemerisPanel.tsx** | Ephemeris data panel |
| **VedicShuddhiRadar.tsx** | Vedic strength radar chart |
| **CandidateComparisonView.tsx** | Candidate comparison UI |
| **ResultsDashboard.tsx** | Final results display |
| **UnifiedAIPanel.tsx** | AI reasoning panel |
| **AdvancedSignalsDashboard** | Advanced astrological signals |
| **AnalysisStatusBanner** | Live analysis status |
| **SimplifiedPipeline** | Pipeline visualization |
| **StageLeaderboard** | Candidate leaderboard |
| **TechnicalMethodology** | Methodology explanation |

### Prism Design System Components (`components/prism/`)

| Component | Purpose |
|-----------|---------|
| **Header.tsx** | Prism-styled sticky header |
| **Footer.tsx** | Prism-styled footer |
| **HeroSection.tsx** | Prism hero with gradient text |
| **FeaturesSection.tsx** | Feature tabs/cards |
| **TestimonialsSection.tsx** | Horizontal scrolling testimonials |
| **PricingSection.tsx** | Pricing cards |
| **CTASection.tsx** | Call-to-action banner |
| **Container.tsx** | Max-width container |
| **Section.tsx** | Section wrapper with padding |
| **Button.tsx** | Prism button (filled/ghost/soft variants) |
| **Card.tsx** | Frosted glass card |
| **Input.tsx** | Form input with frosted glass |
| **Badge.tsx** | Status badges (neutral/spectrum/dark) |
| **Pill.tsx** | Filter/category pills |
| **Modal.tsx** | Prism-styled modal |
| **cn.ts** | `clsx` + `tailwind-merge` utility |

### Dashboard Components (`app/components/dashboard/`)

| Component | Purpose |
|-----------|---------|
| **DashboardLayout.tsx** | Admin layout wrapper |
| **StatsCard.tsx** | Metric cards with trend indicators |
| **ChartCard.tsx** | Chart container card |
| **RecentReadingsTable.tsx** | Data table for recent analyses |
| **ReadingsChart** (async) | Recharts time-series chart |

### Providers (`components/providers/`)

| Component | Purpose |
|-----------|---------|
| **debug-provider.tsx** | Debug context provider |
| **root-test-mode-provider.tsx** | Test mode context |

---

## 3. CSS Files — Complete Inventory

| File | Location | Purpose | Size |
|------|----------|---------|------|
| **globals.css** | `app/globals.css` | **Primary design system** — Dia Browser tokens, base styles, typography, animations, scrollbar, mobile fixes | ~350 lines |
| **prism-design-system.css** | `app/prism-design-system.css` | **Secondary design system** — Prism tokens, component classes (cards, buttons, inputs, badges), mesh gradients, glassmorphism, blob animations, magnetic buttons, spectrum borders | ~800+ lines |
| **ai-content.css** | `app/ai-content.css` | **Legacy dark theme** for AI-generated content — uses old sacred ivory colors (`#F5F0EB`, `#C4B8AD`, `#0F1419`) | ~120 lines |

### globals.css Key Contents
- `:root` CSS variables for Dia colors, spacing, border-radius, transitions
- Base styles: `html`, `body`, headings (h1-h6 with clamp responsive sizing)
- Custom utility classes: `.container-dia`, `.section-padding`, `.form-container-*`
- Animation keyframes: `gentle-float`, `subtle-pulse`, `shimmer`, `fadeInUp`, `scaleIn`
- Scrollbar styling (elegant thin scrollbar)
- Mobile responsiveness fixes (iOS zoom prevention, touch targets, safe areas)
- Reduced motion and high contrast media queries

### prism-design-system.css Key Contents
- `:root` CSS variables for Prism colors, typography, spacing, shadows
- **Component classes**: `.prism-card`, `.prism-btn`, `.prism-btn-ghost`, `.prism-btn-soft`, `.prism-header`, `.prism-input`, `.prism-textarea`, `.prism-link`, `.prism-container`, `.prism-section`, `.prism-badge`, `.prism-tab`, `.prism-testimonial`, `.prism-search-bar`
- **Dia Browser classes**: `.dia-card`, `.dia-btn`, `.dia-btn-ghost`, `.dia-float-widget`, `.dia-section`, `.dia-container`, `.dia-pill`, `.dia-faq-item`, `.dia-mesh-gradient`, `.dia-glass`, `.dia-glow-hero`, `.dia-blob`, `.dia-btn-magnetic`, `.dia-text-gradient`, `.dia-spectrum-border`, `.dia-curve-divider`, `.dia-header-glass`
- Animation keyframes: `prism-fade-in-up`, `prism-scale-in`, `prism-gentle-float`, `prism-gradient-sweep`, `prism-shimmer`, `dia-float`, `dia-blob-morph`, `dia-mesh-shift`, `dia-shimmer`, `dia-pulse-glow`
- Reduced motion support

### ai-content.css Key Contents
- **LEGACY DARK THEME** — completely inconsistent with current light theme
- Uses colors: `#F5F0EB` (text), `#C4B8AD` (muted), `#0F1419` (bg), `#8B5CF6` (links)
- Styled for AI-generated markdown content (headings, paragraphs, lists, code blocks, tables, blockquotes)

---

## 4. Tailwind Config (`tailwind.config.js`)

### Content Paths
```js
content: [
  './pages/**/*.{js,ts,jsx,tsx,mdx}',
  './components/**/*.{js,ts,jsx,tsx,mdx}',
  './app/**/*.{js,ts,jsx,tsx,mdx}',
]
```

### Custom Theme Extensions

#### Colors (3 systems coexisting)
1. **Dia Browser**: `surface`, `primary`, `trust`, `content`, `destructive`, `gold` (monochrome scale), `dia` (bg, ink, border, card, hero-blue)
2. **Prism**: `prism` (ink, snow, canvas, fog, pebble, graphite, slate, steel, ash, rose-quartz, crimson, marigold, lavender, signal-blue, hot-pink)
3. **Legacy gold scale**: `gold.50` through `gold.900` (monochrome — renamed from actual gold)

#### Font Family
- `sans`: `var(--font-dm-sans)`
- `display`: `var(--font-dm-sans)`
- `prism`: `var(--font-dm-sans)`
- `inter`: `var(--font-dm-sans)` (alias)
- `dia-heading`: `var(--font-dm-sans)`
- `dia-serif`: `var(--font-dm-sans)`
- `dia-mono`: `var(--font-mono)`

#### Border Radius
- Prism: `prism-sm` (10px), `prism-md` (16px), `prism-lg` (20px), `prism-xl` (30px), `prism-2xl` (40px)
- Dia: `dia-sm` (12px), `dia-md` (16px), `dia-lg` (20px), `dia-xl` (24px), `dia-2xl` (32px)

#### Box Shadow
- Prism: `prism-sm`, `prism-none`
- Dia: `dia-sm`, `dia-md`, `dia-lg`, `dia-float`

#### Spacing
- Prism scale: `prism-1` (5px) through `prism-14` (120px)
- Dia scale: `dia-1` through `dia-14` (same values)

#### Typography
- Dia font sizes: `dia-caption` (13px), `dia-body` (18px), `dia-body-lg` (22px), `dia-subheading`, `dia-heading-sm`, `dia-heading` (50px), `dia-heading-lg` (54px), `dia-display` (72px), `dia-display-lg` (115px)

#### Animations
- Standard: `fade-in`, `slide-up`, `pulse-soft`
- Prism: `prism-fade-in-up`, `prism-fade-in`, `prism-scale-in`, `prism-gentle-float`, `prism-gradient-sweep`, `prism-shimmer`
- Dia: `dia-float`, `dia-float-slow`, `dia-float-delayed`

#### Other Extensions
- `backdropBlur`: `dia-xs` through `dia-3xl`
- `transitionTimingFunction`: `dia-out`, `dia-out-slow`, `dia-in-out`
- `letterSpacing`: `dia-tight`, `dia-tighter`, `dia-normal`, `dia-wide`, `dia-wider`
- `opacity`: `dia-3` through `dia-85`
- `backgroundImage`: `dia-mesh`, `dia-glow`, `dia-glow-strong`, `dia-spectrum`
- `maxWidth`: `dia-container` (1200px), `dia-narrow` (900px), `dia-wide` (1400px)
- `zIndex`: `dia-header` (50), `dia-overlay` (40), `dia-modal` (30), etc.

---

## 5. Font Setup

### Current Implementation (`app/layout.tsx`)

```tsx
import { DM_Sans, JetBrains_Mono } from 'next/font/google';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  weight: ['300', '400', '500'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});
```

### Font Application
- **Body text**: `var(--font-dm-sans)` — DM Sans, weights 300/400/500
- **Mono/code**: `var(--font-mono)` — JetBrains Mono
- **ALL headings**: DM Sans (no separate display font)
- Applied via Tailwind `font-sans`, `font-display`, `font-prism`, `font-dia-heading`, `font-dia-serif`, `font-dia-mono`
- Applied via CSS `font-family: var(--font-dm-sans), ...`

### Clerk Appearance Fonts
The Clerk auth components are explicitly styled to use DM Sans via `font-[family-name:var(--font-dm-sans)]`.

---

## 6. Design Tokens / CSS Variables

### Dia Browser Tokens (`:root` in globals.css)

| Token | Value | Usage |
|-------|-------|-------|
| `--dia-ink` | `#000000` | Primary text |
| `--dia-snow` | `#ffffff` | White |
| `--dia-canvas` | `#f8f8f8` | Page background |
| `--dia-fog` | `#efefef` | Elevated surfaces |
| `--dia-pebble` | `#d9d9d9` | Borders, dividers |
| `--dia-graphite` | `#636363` | Secondary text |
| `--dia-slate` | `#959595` | Disabled/placeholder |
| `--dia-steel` | `#aeaeae` | Muted elements |
| `--dia-ash` | `#7c7c7c` | Tertiary text |
| `--dia-rose-quartz` | `#c679c4` | Spectrum accent |
| `--dia-crimson` | `#fa3d1d` | Spectrum accent |
| `--dia-marigold` | `#ffb005` | Spectrum accent |
| `--dia-lavender` | `#e1e1fe` | Spectrum accent |
| `--dia-signal-blue` | `#0358f7` | Spectrum accent |
| `--dia-hot-pink` | `#fd02f5` | Spectrum accent |
| `--bg-primary` | `#f8f8f8` | Page background alias |
| `--bg-secondary` | `#ffffff` | Card background |
| `--bg-tertiary` | `#efefef` | Elevated surface alias |
| `--text-primary` | `#000000` | Text alias |
| `--text-secondary` | `#636363` | Muted text alias |
| `--text-tertiary` | `#959595` | Disabled text alias |
| `--text-muted` | `#aeaeae` | Very muted text alias |
| `--space-1` through `--space-24` | 0.25rem to 6rem | Spacing scale |
| `--radius-sm` through `--radius-2xl` | 0.5rem to 1.5rem | Border radius |
| `--transition-fast` | `150ms ease` | Fast transitions |
| `--transition-base` | `250ms ease` | Standard transitions |
| `--transition-slow` | `350ms ease` | Slow transitions |

### Prism Tokens (`:root` in prism-design-system.css)

| Token | Value | Usage |
|-------|-------|-------|
| `--prism-ink` | `#000000` | Primary text |
| `--prism-snow` | `#ffffff` | White |
| `--prism-canvas` | `#f8f8f8` | Page background |
| `--prism-fog` | `#efefef` | Elevated surfaces |
| `--prism-pebble` | `#d9d9d9` | Borders |
| `--prism-graphite` | `#636363` | Secondary text |
| `--prism-slate` | `#959595` | Muted |
| `--prism-steel` | `#aeaeae` | Disabled |
| `--prism-ash` | `#7c7c7c` | Tertiary |
| `--prism-rose-quartz` | `#c679c4` | Spectrum |
| `--prism-crimson` | `#fa3d1d` | Spectrum |
| `--prism-marigold` | `#ffb005` | Spectrum |
| `--prism-lavender` | `#e1e1fe` | Spectrum |
| `--prism-signal-blue` | `#0358f7` | Spectrum |
| `--prism-hot-pink` | `#fd02f5` | Spectrum |
| `--prism-text-caption` | `0.625rem` | Small text |
| `--prism-text-body` | `1rem` | Body text |
| `--prism-text-heading` | `3.125rem` | Heading |
| `--prism-text-display` | `4.5rem` | Display |
| `--prism-space-1` through `--prism-space-14` | 5px to 120px | Spacing |
| `--prism-radius-sm` through `--prism-radius-2xl` | 10px to 40px | Border radius |
| `--prism-shadow-sm` | `0 0 8px rgba(0,0,0,0.08)` | Subtle shadow |
| `--prism-blur-sm/md/lg` | 8px/16px/24px | Backdrop blur |
| `--prism-page-max-width` | `1200px` | Container max-width |

### Note: Token Duplication
**Both Dia and Prism tokens define the same semantic colors** (ink=#000, canvas=#f8f8f8, fog=#efefef, etc.). This is intentional — the two systems are aliases of each other, allowing gradual migration.

---

## 7. Package.json Relevant Dependencies

| Dependency | Version | Purpose |
|-----------|---------|---------|
| **next** | `^15.5.15` | Framework (App Router) |
| **react** / **react-dom** | `^18.3.1` | UI library |
| **tailwindcss** | `^3.4.4` | Utility CSS |
| **framer-motion** | `^11.0.0` | Animations (used heavily in landing page) |
| **lucide-react** | `^0.394.0` | Icons (used everywhere) |
| **@clerk/nextjs** | `^6.0.0` | Authentication |
| **recharts** | `^3.7.0` | Charts (admin dashboard) |
| **zustand** | `^5.0.11` | State management |
| **@tanstack/react-virtual** | `^3.13.18` | Virtualization |
| **date-fns** | `^3.6.0` | Date formatting |
| **jspdf** / **jspdf-autotable** | `^4.2.0` / `^5.0.7` | PDF generation |
| **leaflet** | `^1.9.4` | Maps (birth place picker) |

---

## 8. Specific Files Requiring Modification for Design System Consistency

### Critical — Inconsistent or Legacy Styling

| File | Issue | Action Needed |
|------|-------|---------------|
| `app/ai-content.css` | **Legacy dark theme** — completely inconsistent with light monochrome design | Migrate to light theme or remove |
| `app/page.tsx` | **Inline landing page** (~900 lines) with hardcoded styles, doesn't use shared Navbar/Footer | Refactor to use shared components or ensure all inline styles use design tokens |
| `app/debug-analysis/[id]/page.tsx` | **Hardcoded `THEME` object** with hex values (`bg: '#f8f8f8'`, `gold: '#000000'`, `success: '#184131'`, `error: '#C65D3B'`) | Replace with Tailwind classes or CSS variables |
| `components/Footer.tsx` | Hardcoded hex values (`#ffffff`, `#636363`, `#000000`, `#959595`) | Replace with `var(--dia-*)` or Tailwind classes |
| `app/sign-up/[[...rest]]/page.tsx` | Hardcoded hex values in Clerk appearance (`#000000`, `#C65D3B`, `#184131`, `#9A7609`, `#C49843`) | Use design tokens |
| `app/rectify/[id]/page.tsx` | Mix of Prism classes and hardcoded values | Standardize to single system |
| `app/admin/dashboard/page.tsx` | Uses Prism tokens but also `rose-500`, `emerald-600`, `amber-600`, `blue-600` (Tailwind default colors) | Replace with design system colors |

### Medium Priority — Token Standardization

| File | Issue | Action Needed |
|------|-------|---------------|
| `app/dashboard/page.tsx` | Uses both `dia-*` and `prism-*` classes | Pick one system |
| `app/rectify/page.tsx` | Uses `prism-design-system.css` but also hardcoded `#f8f8f8` | Use tokens |
| `app/terms/page.tsx` | Uses `rounded-dia-xl` but some sections use `rounded-lg` | Standardize border radius |
| `app/privacy/page.tsx` | Uses `rounded-dia-xl` but some elements use `rounded-lg` | Standardize border radius |
| `components/Navbar.tsx` | Uses Prism tokens exclusively — should it use Dia? | Align with target design system |
| `components/ui/Button.tsx` | Uses Prism tokens — align with chosen system |

### Low Priority — Polish

| File | Issue |
|------|-------|
| `app/error.tsx` | Uses hardcoded hex values (`#f8f8f8`, `#000000`) — should use tokens |
| `app/not-found.tsx` | Uses hardcoded hex values (`#f8f8f8`, `#000000`, `#636363`, `#959595`) |
| `app/prism-showcase/page.tsx` | Design system demo page — should be updated if tokens change |
| Various rectify components | Mix of `prism-*`, `dia-*`, and hardcoded values |

---

## 9. Architecture Observations

### Design System Maturity: **7/10**

**Strengths:**
- Comprehensive token system with both CSS variables and Tailwind extensions
- Well-documented with inline comments
- Reduced motion and high contrast accessibility support
- Mobile-first responsive design
- Glassmorphism and subtle animations dialed in
- Clerk auth components fully themed

**Weaknesses:**
- **Two parallel token systems** (Dia + Prism) causing confusion
- **Legacy dark theme** (`ai-content.css`) still present but unused
- **Hardcoded hex values** scattered across pages
- **Landing page is monolithic** — all sections inline, doesn't reuse shared components
- **No single source of truth** — some files use CSS vars, some use Tailwind, some use hardcoded values
- **Inconsistent border radius** — `rounded-dia-xl`, `rounded-prism-lg`, `rounded-lg`, `rounded-2xl` all used
- **Color inconsistency** — some pages use `emerald-500` (Tailwind default), others use `#184131` (custom trust color)

### Recommended Migration Strategy

1. **Pick one system** — Either consolidate on Dia Browser (modern, already used in landing) or Prism (more complete component library)
2. **Remove `ai-content.css`** — It's a legacy dark theme that conflicts with the light monochrome design
3. **Create a `tokens.ts` or `tokens.css`** — Single source of truth for all design tokens
4. **Audit all hardcoded hex values** — Replace with token references
5. **Refactor landing page** — Extract inline sections into reusable components from `components/landing/`
6. **Standardize border radius** — Pick one scale (Dia or Prism) and apply everywhere
7. **Standardize color usage** — Remove Tailwind default colors (`emerald-*`, `rose-*`, etc.) in favor of custom tokens

---

## 10. Files That Will Need Modification (Ranked by Impact)

### High Impact
1. **`app/page.tsx`** — Mega landing page with inline everything
2. **`app/globals.css`** — May need token cleanup/consolidation
3. **`app/prism-design-system.css`** — May need token cleanup/consolidation
4. **`app/ai-content.css`** — Remove or migrate to light theme
5. **`tailwind.config.js`** — Consolidate duplicate token systems

### Medium Impact
6. **`app/debug-analysis/[id]/page.tsx`** — Hardcoded THEME object
7. **`app/rectify/[id]/page.tsx`** — Mix of Prism and hardcoded
8. **`app/sign-up/[[...rest]]/page.tsx`** — Hardcoded Clerk appearance values
9. **`components/Footer.tsx`** — Hardcoded hex values
10. **`components/Navbar.tsx`** — May need system alignment
11. **`app/admin/dashboard/page.tsx`** — Tailwind default colors mixed with custom

### Low Impact
12. **`app/error.tsx`** — Error boundary styling
13. **`app/not-found.tsx`** — 404 page styling
14. **`app/terms/page.tsx`** — Minor border radius inconsistencies
15. **`app/privacy/page.tsx`** — Minor border radius inconsistencies
16. **All `components/rectify/*`** — Gradual standardization
17. **All `components/landing/*`** — Already mostly aligned, minor tweaks

---

*Report generated: 2026-05-06*
*Audited directory: `apps/web/`*
