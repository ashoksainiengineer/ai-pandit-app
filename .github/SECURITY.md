# Security Policy

## Reporting a Vulnerability

We take the security of AI-Pandit seriously. If you discover a security vulnerability, please report it responsibly.

**Do not** open public issues for security vulnerabilities. Instead, send an email to:

**app.aipandit@gmail.com**

You can expect an acknowledgment within 48 hours, and we will work with you to understand the scope and impact of the issue. We aim to release a fix as soon as possible depending on severity.

### What to include
- Description of the vulnerability
- Steps to reproduce
- Affected versions / components
- Any proof of concept (if available)
- Your contact information for follow-up

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| Latest  | ✅ Fully supported |
| Older   | ❌ Not supported   |

Only the latest tagged release receives security patches. Always keep your deployment up to date.

## Security Features

AI-Pandit incorporates the following security measures:

- **AES-256-GCM Encryption** — All sensitive birth data is encrypted at rest and in transit using AES-256-GCM with 96-bit nonces.
- **Clerk Authentication** — User identity and session management is handled by Clerk, providing secure OAuth, MFA, and session tokens.
- **AI Anonymization** — Personally identifiable information (PII) is stripped or anonymized before any AI/LLM processing.
- **Environment Isolation** — Secrets, API keys, and encryption keys are never logged or exposed. All sensitive configuration lives in environment variables.
- **HTTPS Everywhere** — All API and frontend traffic is served over TLS.
- **Input Validation** — All user inputs are validated via Zod schemas before processing.

## Disclosure Policy

- Vulnerabilities are triaged within 48 hours of reporting.
- A fix is developed and tested internally before disclosure.
- Once a fix is released, we will publish an advisory describing the issue (without exposing exploit details) to help users assess risk.
- We request that reporters allow us 90 days from the date of acknowledgment before full public disclosure.

## Scope

Security reviews cover the following components of the monorepo:

- `apps/api` — Express backend API
- `apps/web` — Next.js frontend
- `apps/worker` — Background job processor
- `packages/db` — Database schema and client
- `packages/shared` — Shared types and utilities
- `services/ephemeris` — Python Skyfield ephemeris service

Third-party dependencies are monitored via Dependabot and regularly audited.

## Out of Scope

- Issues in third-party dependencies already reported upstream
- Social engineering attacks
- Physical security attacks
- Issues requiring unrealistic user interaction or privileged access

Thank you for helping keep AI-Pandit and its users safe.
