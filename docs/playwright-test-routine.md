# PHRI Frontend — Playwright MCP Testing Routine

> **Automated version available:** Run `npm run test:e2e` to execute the automated spec in `e2e/app.spec.ts`.

Run with Playwright MCP after starting the dev server (`npm run dev` → http://localhost:5173).

## Pre-requisites
- Dev server running on port 5173
- Backend deployed at https://phri-backend.vercel.app
- Test account credentials (create via the app or use existing)

---

## Test 1: Login Page Renders

1. Navigate to http://localhost:5173
2. Should redirect to /login
3. Verify: "PHRI" title, email input, password input, "Sign In" button
4. Verify: "Sign up" toggle link visible
5. Screenshot: login-page.png

## Test 2: Sign Up Flow

1. On /login, click "Don't have an account? Sign up"
2. Verify: button text changes to "Sign Up"
3. Enter test email + password (min 6 chars)
4. Click "Sign Up"
5. Verify: success toast or redirect
6. Screenshot: signup-result.png

## Test 3: Sign In Flow

1. Navigate to /login
2. Enter existing credentials
3. Click "Sign In"
4. Verify: redirects away from /login (to /consent or /dashboard depending on user state)
5. Screenshot: post-login.png

## Test 4: Consent Page

1. After login (new user), should land on /consent
2. Verify: "Data Consent" heading
3. Verify: 3 checkboxes, all unchecked
4. Verify: "I Agree" button is disabled
5. Check all 3 checkboxes
6. Verify: button becomes enabled
7. Click "I Agree — Continue"
8. Verify: redirects to /connect
9. Screenshot: consent-page.png, consent-filled.png

## Test 5: Connect Persona Page

1. On /connect, verify: "Connect a Health Record" heading
2. Verify: 5 persona cards (Jane, Chris, Ollie, Kyla, Andreas)
3. Verify: "Connect Selected Persona" button is disabled
4. Click Jane Smith card
5. Verify: card has selected styling (ring/border)
6. Click "Connect Selected Persona"
7. Verify: redirects to /progress
8. Screenshot: connect-page.png, persona-selected.png

## Test 6: Progress Page

1. On /progress, verify: "Retrieving Health Records" heading
2. Verify: spinner animation visible
3. Wait for status to change (up to 60s)
4. Verify: eventually redirects to /dashboard OR shows "partial" state
5. Screenshot: progress-spinner.png, progress-complete.png

---

## Test 7: Dashboard Page

1. On /dashboard, verify: persona name in heading (e.g. "Jane's Health Record")
2. Verify: status badge ("ready" or "partial")
3. Verify: summary cards grid (Conditions, Observations, Encounters, etc.)
4. Verify: at least some cards show non-zero counts
5. Verify: 3 CTA cards (Timeline, Deep Dive, Chat)
6. Verify: Recent Activity section with items
7. Screenshot: dashboard.png

## Test 8: Chat Page

1. Navigate to /chat
2. Verify: "Ask about your health records" placeholder text
3. Verify: session sidebar (may show "No chat history")
4. Verify: message input textarea + send button
5. Type "What conditions do I have?" in input
6. Click send (or press Enter)
7. Verify: user message appears (right-aligned, primary color)
8. Verify: assistant response streams in (left-aligned, muted background)
9. Verify: response contains markdown formatting
10. Verify: citation markers [1], [2] etc. appear as styled superscripts
11. Verify: "Sources" section appears below message (if citations exist)
12. Click a citation marker
13. Verify: popover shows excerpt, resource type, date
14. Verify: "New Chat" button works (clears messages)
15. Screenshot: chat-empty.png, chat-response.png, chat-citation.png

---

## Test 9: Timeline Page

1. Navigate to /timeline
2. Verify: "Timeline" heading
3. Verify: filter controls (Resource Type dropdown, From/To date inputs)
4. Verify: list of timeline items with cards
5. Verify: each card has displayText, resourceType badge, date, Source badge
6. Verify: pagination controls (page X of Y, Previous/Next)
7. Click "Next" page button
8. Verify: page number changes
9. Change resource type filter to "Condition"
10. Verify: list updates to show only conditions
11. Click a timeline card
12. Verify: detail drawer slides open from right
13. Verify: drawer shows resource type, display text, date, source
14. Verify: "View Raw FHIR" collapsible exists
15. Screenshot: timeline.png, timeline-filtered.png, timeline-detail.png

## Test 10: Medications Page

1. Navigate to /medications
2. Verify: "Medications" heading
3. Verify: status dropdown, search input
4. Verify: empty state message (sandbox has 0 meds)
5. Screenshot: medications-empty.png

## Test 11: Immunizations Page

1. Navigate to /immunizations
2. Verify: "Immunizations" heading
3. Verify: search input
4. Verify: immunization items grouped by year
5. Verify: total count shown
6. Type in search box (e.g. "influenza")
7. Verify: list filters
8. Click an immunization item
9. Verify: detail drawer opens
10. Screenshot: immunizations.png, immunizations-detail.png

## Test 12: Medication Insights Page

1. Navigate to /medications/insights
2. Verify: "Medication Insights" heading
3. Verify: 3 summary stat cards (Unique, Active, Stopped — all 0 for sandbox)
4. Verify: empty state message
5. Verify: Methodology accordion exists
6. Click Methodology accordion
7. Verify: description, numbered steps, bulleted limitations visible
8. Screenshot: insights.png, insights-methodology.png

## Test 13: Settings Page

1. Navigate to /settings
2. Verify: "Settings" heading
3. Verify: Connected Record section shows persona name + status
4. Verify: AI Mode section with toggle switch (should be ON)
5. Toggle AI mode off
6. Verify: toast "AI mode disabled"
7. Toggle AI mode back on
8. Verify: toast "AI mode enabled"
9. Verify: Disconnect section with button
10. Verify: Delete All Data section with destructive button
11. Screenshot: settings.png

## Test 14: Navigation & Responsive

1. Verify: sidebar nav visible on desktop (Dashboard, Timeline, Medications, Immunizations, Chat, Settings)
2. Click each nav item, verify correct page loads
3. Verify: Sign Out button in sidebar
4. Resize browser to mobile width
5. Verify: sidebar collapses to hamburger menu
6. Click hamburger
7. Verify: sheet slides in with nav items
8. Screenshot: nav-desktop.png, nav-mobile.png

## Test 15: Error States

1. Navigate to /some-invalid-route
2. Verify: redirects to / (which redirects based on auth state)
3. Screenshot: redirect.png

---

## Test Credentials

Create a test account or use an existing one:
- Email: (your test email)
- Password: (your test password)

## Notes

- Sandbox personas have 0 medications — empty state is expected
- Data retrieval takes 15-30s after connecting a persona
- Chat is rate-limited to 10 requests/minute
- The backend at phri-backend.vercel.app must be deployed and accessible
