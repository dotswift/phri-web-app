# PHRI — Testing Guide

This document covers all testing infrastructure for the PHRI frontend: unit tests (Vitest), E2E tests (Playwright), accessibility audits, and manual QA.

---

## Unit Tests (Vitest)

### Running

```bash
npm run test         # Run all unit tests once
npm run test:watch   # Watch mode — re-runs on file changes
```

### Setup

- **Framework:** Vitest 4.x with jsdom environment
- **Libraries:** React Testing Library, @testing-library/user-event, @testing-library/jest-dom
- **Accessibility:** vitest-axe for component-level accessibility checks
- **Config:** `vitest.config.ts`

### Patterns

- Tests live alongside components or in `__tests__/` directories
- Use `render()` from React Testing Library, not ReactDOM directly
- Prefer `getByRole`, `getByLabelText`, `getByText` queries (accessibility-first)
- Mock API calls at the fetch level, not at the component level
- Use `vitest-axe` `expect(container).toHaveNoViolations()` for accessibility assertions

---

## E2E Tests (Playwright)

### Running

```bash
npm run test:e2e      # Headed browser (Chromium) — see what's happening
npm run test:e2e:ci   # Headless — for CI pipelines
npm run test:e2e:ui   # Playwright UI mode — interactive debugging
npm run test:demo     # Demo flow only (headed)
```

### Setup

- **Framework:** Playwright 1.52.x
- **Config:** `playwright.config.ts`
- **Base URL:** `http://localhost:5173` (auto-starts Vite dev server)
- **Timeout:** 60s per test, 10s per expect assertion
- **Workers:** Single worker (no parallel — tests share state)
- **Reporter:** HTML (viewable after test run)
- **Trace:** Captured on first retry for debugging

### Global Setup

`e2e/global-setup.ts` runs before all tests:
1. Creates test user `e2e@phri.dev` / `testpass123` via Supabase admin API
2. Wipes all backend data via `DELETE /api/settings/data` for a clean slate
3. Requires env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_API_URL`

### Test Projects (3, run sequentially)

| Project | File | Depends On | What It Tests |
|---------|------|------------|---------------|
| `app-tests` | `e2e/app.spec.ts` | — | Full user flow: login → consent → connect persona → progress → dashboard → timeline → medications → immunizations → chat → settings → navigation |
| `accessibility-tests` | `e2e/accessibility.spec.ts` | app-tests | WCAG 2.1 AA axe scans on every major page (Login, Dashboard, Timeline, Medications, Insights, Immunizations, Chat, Settings) + interactive states |
| `demo-tests` | `e2e/demo.spec.ts` | accessibility-tests | User-facing demonstration of major features |

Projects run in dependency order: app → accessibility → demo.

### Accessibility E2E

The accessibility test suite uses `@axe-core/playwright` to run full-page WCAG audits:
- Scans every major page after navigation
- Tests interactive states (open popovers, expanded accordions)
- Violations fail the test with detailed output (rule ID, impact, affected elements)

---

## Manual QA Checklist

For features that automated tests can't fully cover, use this checklist:

### Auth & Onboarding
- [ ] Sign up with email → receive confirmation email
- [ ] Log in with existing credentials
- [ ] Consent page: all 3 toggles required before proceeding
- [ ] Profile setup: can enter name and DOB

### Data Connection
- [ ] Connect sandbox persona (Jane/Chris/Ollie/Kyla/Andreas)
- [ ] Progress page shows sync status with real-time updates
- [ ] Epic MyChart: OAuth redirect → login → callback → sync progress
- [ ] PDF upload: select file → SSE progress → extraction complete

### Dashboard
- [ ] Shows correct record counts
- [ ] Recent activity list is chronologically ordered
- [ ] Data sufficiency warning appears when appropriate
- [ ] All navigation links work

### Records
- [ ] Timeline: filter by resource type, filter by date range, pagination works
- [ ] Conditions: grouped display, detail view on click
- [ ] Medications: filtered by status (active/stopped), search works
- [ ] Medication Insights: duplicate detection, dosage changes, citations
- [ ] Lab Results: trend charts with reference ranges
- [ ] Immunizations: grouped by year, search, detail view
- [ ] Visits: encounter list with detail
- [ ] Documents: clinical document list, download/view

### Chat
- [ ] Message streams in real-time (SSE)
- [ ] Citations render as clickable badges
- [ ] Citation popovers show source details
- [ ] Prompt injection attempt shows friendly error
- [ ] New session creation works
- [ ] Session history loads correctly

### Export
- [ ] PDF export downloads a formatted report
- [ ] CSV export downloads spreadsheet data
- [ ] FHIR bundle export downloads JSON
- [ ] Archive (ZIP) downloads all formats
- [ ] Section filtering works
- [ ] Date range filtering works

### Settings
- [ ] AI mode toggle updates instantly
- [ ] Disconnect shows confirmation dialog
- [ ] Delete data requires typing "DELETE"
- [ ] After deletion, user is redirected appropriately

### Responsive & Navigation
- [ ] Mobile: bottom tab bar navigation works
- [ ] Desktop: sidebar navigation works
- [ ] All pages render correctly at 320px, 768px, 1024px+ widths
- [ ] Keyboard navigation works on all interactive elements
- [ ] Focus management works on page transitions

---

## Test Credentials

For local development and E2E:
- **Email:** `e2e@phri.dev`
- **Password:** `testpass123`
- **Sandbox persona:** Any of the 5 Metriport sandbox personas

For Epic testing:
- Use Epic's sandbox test patient credentials from [open.epic.com](https://open.epic.com/)
