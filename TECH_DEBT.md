# Technical Debt Tracker

> Last updated: 2026-03-05
> 
> This file tracks all known technical debt. Update when adding/removing items.

## Priority Levels
- 🔴 **Critical** - Blocks development or causes production issues
- 🟠 **High** - Significant impact on productivity or performance
- 🟡 **Medium** - Should be addressed soon
- 🟢 **Low** - Nice to have, backlog item

---

## 🔴 Critical Debt

| ID | Description | Location | Impact | Owner | Status |
|----|-------------|----------|--------|-------|--------|
| C1 | _Example: Database migration needed_ | `apps/api/drizzle/` | Deploy blocked | @ashok | Pending |

---

## 🟠 High Priority

| ID | Description | Location | Impact | Owner | Status |
|----|-------------|----------|--------|-------|--------|
| H1 | _Example: Remove backup files_ | `apps/web/components/` | Code bloat | - | Pending |
| H2 | _Example: Consolidate test files_ | `apps/api/src/__tests__/` | Confusion | - | Pending |

---

## 🟡 Medium Priority

| ID | Description | Location | Impact | Owner | Status |
|----|-------------|----------|--------|-------|--------|
| M1 | _Example: Add missing types_ | Various files | Type safety | - | Pending |
| M2 | _Example: Update dependencies_ | `package.json` | Security | - | Pending |

---

## 🟢 Low Priority / Backlog

| ID | Description | Location | Impact | Owner | Status |
|----|-------------|----------|--------|-------|--------|
| L1 | _Example: Improve error messages_ | Various | DX | - | Pending |

---

## TODOs by Area

### Frontend (apps/web)
- [ ] Remove unused components
- [ ] Consolidate CSS/Tailwind classes
- [ ] Add missing prop types

### Backend (apps/api)
- [ ] Remove debug/test files
- [ ] Consolidate middleware
- [ ] Add missing error handling

### Shared (packages/)
- [ ] Review and update types
- [ ] Add missing Zod schemas

### Infrastructure
- [ ] Update GitHub Actions
- [ ] Review Docker configuration
- [ ] Clean up environment variables

---

## Resolved Debt

| ID | Description | Resolution | Date | PR |
|----|-------------|------------|------|-----|
| R1 | _Example: Fixed memory leak_ | Added GC threshold | 2026-02-15 | #123 |

---

## How to Add New Debt

1. Create issue on GitHub with label `tech-debt`
2. Add to appropriate priority section above
3. Link to relevant files/code
4. Assign owner if known

## Weekly Review

Every Friday, review this file:
1. Update status of in-progress items
2. Promote/demote priorities as needed
3. Close resolved items
4. Add newly discovered debt
