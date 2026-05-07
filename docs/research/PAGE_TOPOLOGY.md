# Page Topology — diabrowser.com

**Source**: https://diabrowser.com
**Captured**: 2026-05-07
**Viewport**: Desktop 1440px

---

## Visual Order (Top → Bottom)

```
┌─────────────────────────────────────────────────────────────────┐
│ SECTION 1: NAVIGATION (fixed, sticky)                           │
│ ┌───────────────────────────────────────────────────────────────┐│
│ │ Logo(Dia) │ [What's New] [Security] [Mornings]     [Download]││
│ └───────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│ SECTION 2: HERO (scroll-driven, full-viewport)                   │
│ ┌───────────────────────────────────────────────────────────────┐│
│ │                    [Badge: "Watch the trailer video"]         ││
│ │                                                                ││
│ │           A browser that  works  with you                     ││
│ │                        (animated word)                        ││
│ │                                                                ││
│ │     Dia surfaces what's next, what's ready, and what you      ││
│ │     missed, so you can focus.                                 ││
│ │                                                                ││
│ │              [Download Dia] (black pill button)               ││
│ │                                                                ││
│ │     ┌─────────────────────────────────────────┐               ││
│ │     │  1 in 110m                              │               ││
│ │     │  Morning Brief                          │               ││
│ │     │  💐 Spring Planning                     │               ││
│ │     │  ┌──────┬──────┬──────┐                 │               ││
│ │     │  │ Tab1 │ Tab2 │ Tab3 │  ← floating     │               ││
│ │     │  └──────┴──────┴──────┘    widget card   │               ││
│ │     └─────────────────────────────────────────┘               ││
│ └───────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│ SECTION 3: "Dia reads between the tabs" (scroll-driven)          │
│ ┌───────────────────────────────────────────────────────────────┐│
│ │  [01] Start your day two steps ahead                          ││
│ │  ┌─────────────────────────────────────────────────────────┐  ││
│ │  │              Screenshot / Browser Mockup                 │  ││
│ │  └─────────────────────────────────────────────────────────┘  ││
│ │  [02] You focus, Dia suggests                                 ││
│ │  ┌─────────────────────────────────────────────────────────┐  ││
│ │  │              Screenshot / Browser Mockup                 │  ││
│ │  └─────────────────────────────────────────────────────────┘  ││
│ │  [03] Find the answer without hunting it down                 ││
│ │  ┌─────────────────────────────────────────────────────────┐  ││
│ │  │              Screenshot / Browser Mockup                 │  ││
│ │  └─────────────────────────────────────────────────────────┘  ││
│ └───────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│ SECTION 4: "Built for how you actually work" (scroll-driven)     │
│ ┌───────────────────────────────────────────────────────────────┐│
│ │  ┌──────────┐  ┌──────────┐  ┌──────────┐                    ││
│ │  │ Reports  │  │Live Work │  │ Better   │                    ││
│ │  │          │  │          │  │ Meetings │                    ││
│ │  └──────────┘  └──────────┘  └──────────┘                    ││
│ │  ┌──────────┐  ┌──────────┐  ┌──────────┐                    ││
│ │  │ Profiles │  │ Splits   │  │Organized │                    ││
│ │  │          │  │          │  │  Tabs    │                    ││
│ │  └──────────┘  └──────────┘  └──────────┘                    ││
│ └───────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│ SECTION 5: "Privacy first with you in control" (scroll-driven)   │
│ ┌───────────────────────────────────────────────────────────────┐│
│ │           Privacy first                                       ││
│ │           with you in control                                 ││
│ │                                                                ││
│ │  ┌─────────────────────────────────────────────────────────┐  ││
│ │  │ Block trackers  On  │ Personalize chats  Off │ Memory On │  ││
│ │  │ Block ads       On  │ Share content    Off  │           │  ││
│ │  └─────────────────────────────────────────────────────────┘  ││
│ │                                                                ││
│ │           [Learn more about privacy →]                        ││
│ └───────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│ SECTION 6: CTA FOOTER                                            │
│ ┌───────────────────────────────────────────────────────────────┐│
│ │           Ready for a better day?                             ││
│ │              [Download Dia]                                   ││
│ └───────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Section Details

### 1. NAVIGATION
- **Type**: Fixed/Sticky overlay
- **z-index**: 50 (site nav layer)
- **Height**: ~52px (3.25rem)
- **Background**: rgba(255,255,255,0.9) with backdrop-blur
- **Behavior**: Becomes opaque on scroll, gets bottom border
- **Items**: Logo (left), nav links (center), CTA button (right)

### 2. HERO
- **Type**: Flow content, full-viewport
- **Background**: Blue mesh gradient (#a8c4e8 → #b8d3ee → #c8ddf5) with noise overlay
- **Content**: Badge → Animated heading → Subtitle → CTA button → Floating widget
- **Animation**: Word-cycling in heading (works/plays/thinks), floating cards staggered entrance
- **Min Height**: ~90vh

### 3. NUMBERED FEATURES ("Dia reads between the tabs")
- **Type**: Flow content
- **Background**: #F8F8F8
- **Structure**: 3 numbered items (01, 02, 03) with left border, image mockup on right
- **Interaction**: Scroll-driven — each number animates in with fade+slide

### 4. FEATURE CARDS ("Built for how you actually work")
- **Type**: Flow content
- **Background**: White (#FFFFFF)
- **Structure**: 6 feature cards in 3x2 grid (Reports, Live Work, Better Meetings, Profiles, Splits, Organized Tabs)
- **Cards**: White background, subtle border, rounded-20px, shadow-sm

### 5. PRIVACY ("Privacy first with you in control")
- **Type**: Flow content
- **Background**: #F8F8F8
- **Structure**: Centered heading + subtitle + toggle pill grid + description + link
- **Toggles**: Active (black) / Inactive (gray) pills with On/Off indicators

### 6. CTA FOOTER
- **Type**: Flow content
- **Background**: White (#FFFFFF)
- **Structure**: Centered heading + black pill CTA button
- **Padding**: 120px top/bottom

---

## Dependencies
- ALL sections are flow content (no overlapping z-index issues)
- Navbar is the only fixed overlay
- Sections are independent — no cross-section data dependencies

## Layout Constraints
- Max width: 1200px (centered, with 1.5rem padding)
- Section vertical spacing: 120px (7.5rem) for major, 80px (5rem) for minor
- Single scroll container (no horizontal scroll)
