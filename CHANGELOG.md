# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added
- Live analysis engine components (AIThinkingBox, EphemerisTable, CandidateComparisonTable)
- Comprehensive README with architecture diagram and 13 sections
- Industry-standard GitHub files (SECURITY.md, CONTRIBUTING.md, CODEOWNERS)
- CI/CD workflow (ci.yml) for automated quality checks
- Pre-commit hooks (Husky + lint-staged)
- Dependabot configuration for automated dependency updates
- GitHub Secret Scanning and Push Protection
- NOTICE file with third-party attributions and trademark disclaimers

### Changed
- Complete landing page redesign with unified light theme
- All pages unified to consistent design system
- Sign-in/sign-up pages redesigned to match site theme
- Email references unified to `app.aipandit@gmail.com`
- Domain references unified to `aipandit.app`

### Fixed
- Duplicate step rendering bug in rectify page
- Step4Review old color scheme replaced with design tokens
- FormCard AI slop comments removed
- 11 duplicate items removed from Terms of Service
- Invalid Tailwind classes fixed in Dashboard
- Dead navigation links removed from Navbar and Footer

### Removed
- All "Dia Browser" references from entire codebase (40+ instances)
- Desloppify references from README and workflows
- Unnecessary root files (15 BTR reports moved to docs/analysis/)
- AI workspace files (.claude, .sisyphus, .cursorrules)
- Dead gandhi test scripts (zero imports)
- Playwright screenshots and log files from git tracking

### Security
- Bot-proof email format in SECURITY.md and CONTRIBUTING.md
- Enhanced proprietary LICENSE with governing law (India/Mumbai)
- AES-256-GCM encryption details documented
