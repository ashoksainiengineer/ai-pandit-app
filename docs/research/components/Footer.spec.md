# Footer Specification

## Overview
- **Target file:** `apps/web/components/Footer.tsx`
- **Interaction model:** Static
- **Background:** White (#FFFFFF)

## DOM Structure
```
<footer> (bg-white, border-t border-black/[0.05])
  └── <div> (max-w-[1200px], mx-auto, px-6, py-20)
      ├── Grid (grid-cols-2 md:grid-cols-5, gap-10 md:gap-16)
      │   ├── Brand Column (col-span-2)
      │   │   ├── Logo (ॐ + "AI Pandit")
      │   │   ├── Description
      │   │   └── Social Icons (GitHub, Twitter, Email)
      │   ├── Product Links
      │   ├── Resources Links
      │   ├── Company Links
      │   └── Legal Links
      └── Bottom Bar (border-t, pt-8, mt-16, centered)
          └── Copyright (text-xs, text-black/30)
```

## Computed Styles

### Footer Container
- background: #FFFFFF
- border-top: 1px solid rgba(0, 0, 0, 0.05)
- padding: 5rem 1.5rem (py-20 px-6)

### Brand Text
- font-size: 1.5rem (24px)
- font-weight: 500
- color: #000000

### Description
- font-size: 0.875rem (14px)
- line-height: 1.6
- color: #636363 (text-secondary)

### Section Headers
- font-size: 0.75rem (12px)
- font-weight: 600
- text-transform: uppercase
- letter-spacing: 0.1em
- color: rgba(0, 0, 0, 0.4)
- margin-bottom: 1.25rem

### Links
- font-size: 0.875rem (14px)
- color: rgba(0, 0, 0, 0.4)
- transition: color 200ms
- hover: color: rgba(0, 0, 0, 0.8)

### Social Icons
- width: 2.5rem / height: 2.5rem
- border-radius: 9999px
- background: rgba(0, 0, 0, 0.05)
- color: rgba(0, 0, 0, 0.3)
- hover: color: #000000, background: rgba(0, 0, 0, 0.1)

### Copyright
- font-size: 0.75rem (12px)
- color: rgba(0, 0, 0, 0.3)
- text-align: center

## Text Content (Verbatim — AI Pandit)
- Brand: "AI Pandit"
- Description: "AI-powered Vedic birth time rectification with seconds-level precision. Private by design."
- Product: Start Analysis, Dashboard, How It Works, Features
- Resources: Documentation, API Reference
- Company: About, Blog, Careers, Contact
- Legal: Privacy Policy, Terms of Service, Cookie Policy
- Copyright: "© {year} AI Pandit. All rights reserved."
