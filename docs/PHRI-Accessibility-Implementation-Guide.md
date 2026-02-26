# PHRI Accessibility Implementation Guide

**A rock-solid, implementable accessibility specification for the Personal Health Record & Insights app**

This document is a companion to the PHRI Frontend UX Design Specification. It provides the complete accessibility layer — every ARIA pattern, keyboard flow, screen reader script, zoom behavior, chart alternative, and testing procedure needed to achieve genuine WCAG 2.1 AA compliance. Not "passes an automated scan" compliance, but "a blind user can confidently navigate their medication history" compliance.

Health apps have higher accessibility stakes than typical web apps. Users may be elderly, cognitively stressed, visually impaired, or physically limited. In 2024, HHS finalized rules requiring WCAG 2.1 Level AA for federally funded healthcare digital properties by May 2026. Even without regulatory obligation, a health app that excludes 15% of the global population from accessing their own medical data is a failed product.

---

## Table of Contents

1. [Foundational Principles](#1-foundational-principles)
2. [Automated Testing Infrastructure](#2-automated-testing-infrastructure)
3. [Semantic HTML & Landmark Architecture](#3-semantic-html--landmark-architecture)
4. [Keyboard Navigation Maps (All Pages)](#4-keyboard-navigation-maps-all-pages)
5. [Screen Reader Interaction Scripts](#5-screen-reader-interaction-scripts)
6. [Chart & Data Visualization Accessibility](#6-chart--data-visualization-accessibility)
7. [Streaming Chat Accessibility](#7-streaming-chat-accessibility)
8. [Citation System Accessibility](#8-citation-system-accessibility)
9. [Zoom, Reflow & Responsive Accessibility](#9-zoom-reflow--responsive-accessibility)
10. [Color & Contrast Compliance](#10-color--contrast-compliance)
11. [Motion & Animation Accessibility](#11-motion--animation-accessibility)
12. [Form & Input Accessibility](#12-form--input-accessibility)
13. [Cognitive Accessibility & Health Literacy](#13-cognitive-accessibility--health-literacy)
14. [Mobile & Touch Accessibility](#14-mobile--touch-accessibility)
15. [Manual Testing Protocol](#15-manual-testing-protocol)
16. [Accessibility Checklist by Page](#16-accessibility-checklist-by-page)

---

## 1. Foundational Principles

### The First Rule of ARIA

Use native HTML elements before reaching for ARIA. A `<button>` is always better than `<div role="button">`. A `<table>` with `<th scope="col">` is always better than a grid of divs with ARIA roles. Radix UI primitives (used by shadcn/ui) generally produce correct semantic HTML — verify this rather than assuming it.

**When ARIA is necessary:**
- Custom widgets with no native HTML equivalent (citation popovers, medication timeline charts, streaming chat)
- Dynamic content updates (live regions for sync status, chat streaming, filter results)
- Complex state relationships (expanded/collapsed panels, selected tabs, active filters)

### Triple-Encoding Rule

Every piece of status information must be communicated through at least three channels:

1. **Color** (visual users without CVD)
2. **Icon/shape** (visual users with CVD)
3. **Text label** (screen reader users and all visual users)

Never rely on any single channel. This applies to: medication status (active/stopped/completed), lab result ranges (normal/high/low), sync states (connected/syncing/error), and FHIR resource type badges.

### Anxiety-Aware Language

Replace clinical/technical terminology with plain language throughout:

| Instead of... | Use... |
|---|---|
| Abnormal | Outside typical range |
| Failed | Needs review |
| Negative (test result) | Not detected |
| Error loading data | We're having trouble loading this — try again |
| Expired (immunization) | May need updating |
| Terminated | Ended |
| Critical | Needs attention |
| Invalid input | Please check this field |

Target a **6th–8th grade reading level** for all user-facing text. Use the Hemingway App or similar tool to verify during content review.

---

## 2. Automated Testing Infrastructure

Automated tools catch approximately 30–57% of accessibility issues. They are the floor, not the ceiling. Set up all three layers described below.

### Layer 1: Unit-Level — vitest-axe

Run axe-core against every rendered component in your Vitest test suite. This catches missing labels, broken ARIA relationships, and role violations at the component level.

**Setup:**

```bash
pnpm add -D vitest-axe
```

```typescript
// vitest-setup.ts
import "vitest-axe/extend-expect";
```

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: "jsdom", // NOT happy-dom (vitest-axe bug)
    setupFiles: ["./vitest-setup.ts"],
  },
});
```

**Pattern — Every component gets an axe test:**

```typescript
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { MedicationCard } from "./MedicationCard";

describe("MedicationCard", () => {
  it("should have no accessibility violations", async () => {
    const { container } = render(
      <MedicationCard
        name="Lisinopril"
        status="active"
        dosage="10mg daily"
        source="Kaiser Permanente"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  // Test ALL states — active, stopped, completed, empty
  it("should have no violations in stopped state", async () => {
    const { container } = render(
      <MedicationCard name="Metformin" status="stopped" dosage="500mg" source="Sutter" />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

**Critical:** Test every interactive state. A component that passes axe when collapsed may fail when expanded (missing aria-expanded, focus trap issues). Test: default, hover (if it changes DOM), expanded, loading, error, empty.

**Note:** vitest-axe does NOT test color contrast (JSDOM has no rendering engine). Contrast must be tested separately — see Layer 2 and manual testing.

### Layer 2: Dev-Time — @axe-core/react

Run axe-core in the browser during development. This catches violations in the real rendered DOM, including contrast issues.

```typescript
// main.tsx (development only)
if (import.meta.env.DEV) {
  import("@axe-core/react").then((axe) => {
    axe.default(React, ReactDOM, 1000); // 1s debounce
  });
}
```

This logs violations to the browser DevTools console in real-time as you develop. Do NOT ship to production.

### Layer 3: E2E — Playwright + @axe-core/playwright

Run full-page accessibility audits in actual browser rendering as part of your CI pipeline.

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = [
  { name: "Login", path: "/login" },
  { name: "Dashboard", path: "/dashboard" },
  { name: "Timeline", path: "/timeline" },
  { name: "Medications", path: "/medications" },
  { name: "Medication Insights", path: "/medications/insights" },
  { name: "Immunizations", path: "/immunizations" },
  { name: "Chat", path: "/chat" },
  { name: "Settings", path: "/settings" },
];

for (const page of pages) {
  test(`${page.name} should have no accessibility violations`, async ({ page: p }) => {
    await p.goto(page.path);
    // Wait for dynamic content to load
    await p.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page: p })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"]) // WCAG 2.1 AA
      .analyze();

    expect(results.violations).toEqual([]);
  });
}

// Test interactive states too
test("Chat page with open citation popover", async ({ page }) => {
  await page.goto("/chat");
  // Trigger a chat response, click a citation...
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
```

### CI Integration

Add to your CI pipeline so no PR merges with accessibility regressions:

```yaml
# .github/workflows/a11y.yml
- name: Accessibility audit
  run: pnpm exec playwright test e2e/accessibility.spec.ts
```

---

## 3. Semantic HTML & Landmark Architecture

### Page Landmarks

Every page must have a correct landmark structure. Screen reader users navigate by landmarks — they jump directly to `<main>`, `<nav>`, `<aside>`, etc. Without landmarks, navigating a page is like reading a book with no chapters.

```html
<!-- App shell (layout.tsx) -->
<body>
  <!-- Skip link — MUST be first focusable element -->
  <a href="#main-content" class="sr-only focus:not-sr-only focus:absolute focus:z-50
    focus:p-4 focus:bg-white focus:text-primary-600 focus:underline">
    Skip to main content
  </a>

  <!-- Mobile: bottom tab bar is <nav>, desktop: sidebar is <nav> -->
  <nav aria-label="Main navigation">
    <!-- Navigation items -->
  </nav>

  <main id="main-content" tabindex="-1">
    <!-- Page content -->
    <!-- tabindex="-1" allows programmatic focus without adding to tab order -->
  </main>

  <!-- Chat sidebar (when present on desktop) -->
  <aside aria-label="Chat sessions">
    <!-- Session list -->
  </aside>
</body>
```

### Heading Hierarchy

Every page must have exactly ONE `<h1>` and a logical descending hierarchy. Screen reader users navigate by headings — 67.5% of screen reader users use headings as their primary navigation method (WebAIM survey 2024).

```
Dashboard page:
  h1: "Your Health Overview"
    h2: "Health Highlights"
    h2: "Your Records"
      h3: "Conditions (12)"
      h3: "Medications (5 active)"
      h3: "Lab Results (28)"
    h2: "Recent Activity"

Timeline page:
  h1: "Health Timeline"
    h2: "Filters"
    h2: "Results (showing 20 of 159)"

Medications page:
  h1: "Medications"
    h2: "Active Medications (3)"
    h2: "Past Medications (8)"

Chat page:
  h1: "Health Assistant"
    h2: "Conversation" (visually hidden, for screen reader structure)
```

### Required Landmark Labels

When multiple landmarks of the same type exist, each must have a unique `aria-label`:

```html
<!-- Two <nav> elements need labels -->
<nav aria-label="Main navigation">...</nav>
<nav aria-label="Chat sessions">...</nav>

<!-- Two <aside> elements need labels -->
<aside aria-label="Filters">...</aside>
<aside aria-label="Record details">...</aside>
```

---

## 4. Keyboard Navigation Maps (All Pages)

### Global Keyboard Shortcuts

These work on every page:

| Key | Action |
|---|---|
| `Tab` | Move to next focusable element |
| `Shift+Tab` | Move to previous focusable element |
| `Escape` | Close any open modal, drawer, popover, or sheet |
| `Enter` or `Space` | Activate the focused button or link |

### Login / Sign Up Page

Tab order: Email input → Password input → Show/hide password toggle → Submit button → Toggle sign-in/sign-up link

```
Tab flow:
1. Skip link → main content
2. Email input (autofocus on page load)
3. Password input
4. Show/hide password button (aria-label="Show password" / "Hide password")
5. "Sign in" button (or "Create account")
6. "Don't have an account? Sign up" link (or reverse)

Enter: submits form from any input
```

### Consent Page

Tab order: Consent text (readable) → Checkbox 1 → Checkbox 2 → Checkbox 3 → Submit button (disabled until all checked)

```
Tab flow:
1. Skip link → main content
2. Page heading (h1, not focusable — screen reader reads it)
3. Consent explanation text
4. Checkbox 1: "Health data storage" — aria-describedby links to explanation paragraph
5. Checkbox 2: "AI processing" — aria-describedby links to explanation paragraph
6. Checkbox 3: "Data deletion rights" — aria-describedby links to explanation paragraph
7. "I agree" button — aria-disabled="true" until all checked

Space: toggles checkbox
When all 3 checked: button becomes aria-disabled="false", announce via live region
  "All consent items acknowledged. You can now proceed."
```

### Connect Page (Persona Selection)

Pattern: **Radio group** — personas are mutually exclusive selections.

```
Tab flow:
1. Skip link → main content
2. Page heading
3. Radio group (aria-label="Select a test persona")
   Arrow keys navigate between personas
   Each radio: aria-label="Jane, 30 years old female, approximately 159 records"
4. "Connect" button — aria-disabled="true" until persona selected

Arrow Up/Down: navigate personas within radio group
Space: select persona
Enter on Connect button: initiates connection
```

### Progress Page

This page has NO interactive elements during loading — it's purely informational. The critical accessibility pattern is **live region announcements**.

```html
<main>
  <h1>Retrieving Your Health Records</h1>
  
  <!-- Status updates announced to screen readers -->
  <div role="status" aria-live="polite" aria-atomic="true">
    <!-- Updated by JS as status changes -->
    Connecting to health network... (Step 1 of 3)
  </div>
  
  <!-- Progress indicator -->
  <div role="progressbar" aria-valuenow="33" aria-valuemin="0" aria-valuemax="100"
       aria-label="Record retrieval progress: 33%">
  </div>
  
  <!-- When partial: "Continue to dashboard" button appears -->
  <!-- When failed: "Retry" button appears -->
</main>
```

**Live region update cadence:** Announce status changes, NOT every poll tick. Only announce when the status text actually changes:
- "Connecting to health network..."
- "Retrieving your records... This may take a moment."
- "Almost done — processing your records..."
- "Your records are ready! Redirecting to your dashboard."
- (On failure) "We had trouble retrieving your records. You can try again."

### Dashboard

Tab order: Greeting (not focusable) → Highlights cards (each focusable) → Record category cards → Quick action buttons → Recent activity items

```
Tab flow:
1. Skip link → main content
2. Highlights section
   2a. Each highlight card is a focusable element (role="article" or <article>)
   2b. If card has an action link, that link is the focusable target
3. Record categories
   3a. Each category card is a link (<a>) to its section
   3b. aria-label="Medications: 5 active, 8 total. View all medications"
4. Quick action buttons ("Ask about my labs", "View medications")
5. Recent activity list
   5a. Each item is a link to the record detail
   5b. Grouped in a <ul> with aria-label="Recent health events"

Enter on category card: navigates to that section
Enter on activity item: opens record detail
```

### Timeline

This is the most complex page — 159 records with filters, pagination, and drill-down details.

```
Tab flow:
1. Skip link → main content
2. Page heading
3. Filter controls region (role="search" aria-label="Filter health records")
   3a. Resource type dropdown (Radix Select — arrow keys within)
   3b. Date from input
   3c. Date to input
   3d. "Apply filters" button (if not auto-apply)
   3e. "Clear filters" button
4. Results summary (role="status" aria-live="polite")
   "Showing 20 of 159 records, filtered by: Lab Results"
5. Results list (<ol> with aria-label="Health records, page 1 of 8")
   5a-5t. Each record is a <li> containing a <button> or <a>
   Arrow keys do NOT navigate between items (this is a list, not a grid)
   Each item: accessible name = "Observation: Blood Glucose, October 15, 2025, from Kaiser Permanente"
6. Pagination controls
   6a. "Previous page" button (aria-disabled when on page 1)
   6b. Page number buttons (aria-current="page" on active)
   6c. "Next page" button

Enter on record item: opens detail view (Sheet/Drawer)
Escape from detail view: returns focus to the item that opened it
```

**Filter change announcement:**

```html
<!-- Hidden live region updated when filters change -->
<div role="status" aria-live="polite" class="sr-only">
  Showing 28 lab results from January to March 2025, page 1 of 2
</div>
```

### Timeline Detail View (Sheet/Drawer)

When a record detail opens in a Sheet (shadcn), it must behave as a **dialog**:

```
Opening:
1. Sheet opens with role="dialog" aria-modal="true" aria-labelledby="detail-title"
2. Focus moves to the first focusable element inside (close button or first interactive element)
3. Tab is trapped inside the dialog — Tab from last element wraps to first
4. Background content gets aria-hidden="true"

Tab flow inside:
1. Close button (top right, aria-label="Close record details")
2. Record content (scrollable region with tabindex="0" for keyboard scrolling)
3. Citation/source link (if present)
4. "View raw data" button (if present)

Closing:
- Escape key closes the dialog
- Focus returns to the record item in the list that opened it
- Background aria-hidden="true" is removed
```

**Focus restoration is critical.** When the sheet closes, the user must return to exactly where they were in the list. Store a ref to the triggering element and call `.focus()` on close.

### Medications Page

```
Tab flow:
1. Skip link → main content
2. Page heading
3. Search input (aria-label="Search medications by name", role="searchbox")
4. Status filter (Radix Select or radio group: All, Active, Stopped, Completed)
5. Results live region (polite, announces count changes)
6. Active medications section
   6a. Section heading "Active Medications (3)"
   6b-6d. Each medication card (focusable, acts as button to open detail)
7. Past medications section
   7a. Section heading "Past Medications (8)"
   7b-7i. Each medication card

Each medication card accessible name:
  "Lisinopril, 10 milligrams daily, active, from Kaiser Permanente"

Search debounce: announce results after debounce completes
  Live region: "3 medications match 'Lisin'"
```

**Empty state (most common in sandbox):**

```html
<div role="status">
  <h2>No Medications Found</h2>
  <p>No medication records were found in your connected health data.
     This could mean your records don't include prescriptions, or
     medications are stored differently by your provider.</p>
</div>
```

### Medication Insights Page

The most complex page for accessibility — contains charts, expandable sections, and citation links.

```
Tab flow:
1. Skip link → main content
2. Page heading "Medication Insights"
3. Summary stats (each is a non-interactive <article>)
   3a. "Total unique medications: 5"
   3b. "Currently active: 3"
   3c. "Stopped: 2"
4. Dosage Changes section
   4a. Section heading
   4b. Chart container (see Section 6 for chart accessibility)
   4c. Data table alternative (expandable <details>)
   4d. Each medication's history — expandable accordion
5. Duplicate Detection section
   5a. Section heading
   5b. Each duplicate group — expandable accordion
   5c. Inside: list of occurrences with citation links
6. Methodology section
   6a. Section heading
   6b. Description text
   6c. Steps list
   6d. Limitations list

Accordion keyboard pattern (WAI-ARIA APG):
  Enter/Space: toggle expanded/collapsed
  Arrow Down: move to next accordion header
  Arrow Up: move to previous accordion header
  Home: move to first accordion header
  End: move to last accordion header
```

### Immunizations Page

```
Tab flow:
1. Skip link → main content
2. Page heading
3. Search input (aria-label="Search immunizations by name")
4. Results live region
5. Immunization groups by year
   5a. Year heading (h2: "2024")
   5b-5d. Immunization cards within that year
   Next year heading, etc.

Each immunization card:
  aria-label="Influenza vaccine, completed, October 2024, from Walgreens"

Search announcement: "4 immunizations match 'flu'"
```

### Chat Page

See dedicated Section 7 below for full streaming chat accessibility.

### Settings Page

```
Tab flow:
1. Skip link → main content
2. Page heading
3. Connected Record section
   3a. Connection status (read-only, aria-live for sync updates)
   3b. "Sync now" button
4. AI Mode section
   4a. Toggle switch (role="switch", aria-checked, aria-describedby → explanation text)
5. Danger Zone section
   5a. "Disconnect health data" button → opens AlertDialog
   5b. "Delete all data" button → opens AlertDialog

Toggle switch pattern:
  Space: toggles on/off
  aria-checked="true"/"false"
  On toggle: live region announces "AI features enabled" / "AI features disabled"

Destructive action dialogs: see Section 12
```

---

## 5. Screen Reader Interaction Scripts

These scripts describe exactly what a screen reader user should hear when navigating key flows. Test against these scripts with VoiceOver (macOS/iOS) and NVDA (Windows).

### Script 1: Navigating the Dashboard

```
User presses Tab from skip link:
  SR: "Your Health Overview, heading level 1"

User navigates by heading (H key):
  SR: "Health Highlights, heading level 2"
  SR: "Your Records, heading level 2"
  SR: "Conditions, 12 total, link"
  SR: "Medications, 5 active of 8 total, link"
  SR: "Lab Results, 28 total, link"
  ...
  SR: "Recent Activity, heading level 2"

User activates "Medications" card:
  SR: (page navigation) "Medications, heading level 1"
```

### Script 2: Filtering the Timeline

```
User tabs to filter region:
  SR: "Filter health records, search region"

User tabs to resource type dropdown:
  SR: "Record type, All types, combo box collapsed"

User presses Enter/Space to open:
  SR: "All types, selected. List box. 9 items."

User arrows down:
  SR: "Condition"
  SR: "Lab Result"

User presses Enter to select:
  SR: "Lab Result, selected"
  (dropdown closes)

After filter applies (live region):
  SR: "Showing 28 lab results, page 1 of 2"

User tabs to results:
  SR: "Health records, page 1 of 2, list, 20 items"
  SR: "1. Observation: Blood Glucose, 95 milligrams per deciliter,
       October 15, 2025, from Kaiser Permanente"
```

### Script 3: Viewing a Medication Detail

```
User tabs to medication card:
  SR: "Lisinopril, 10 milligrams daily, active, from Kaiser Permanente, button"

User presses Enter:
  SR: "Record details, dialog"
  SR: "Close record details, button"

User tabs through content:
  SR: "Lisinopril, heading level 2"
  SR: "Status: Active"
  SR: "Dosage: 10 milligrams, once daily, oral"
  SR: "Prescribed: January 12, 2024"
  SR: "Source: Kaiser Permanente, citation link"

User presses Escape:
  (dialog closes, focus returns to Lisinopril card)
  SR: "Lisinopril, 10 milligrams daily, active, from Kaiser Permanente, button"
```

### Script 4: Reading Chat Response with Citations

```
(After submitting a question, streaming completes)
SR: "Assistant response"
SR: "Your most recent hemoglobin A1C was 6.2 percent, citation 1,
     which is within the typical range. This represents an improvement
     from 6.8 percent, citation 2, six months ago."

User tabs to citation [1]:
  SR: "Citation 1, Lab Result: Hemoglobin A1C, October 2025, button"

User presses Enter:
  SR: "Citation details, dialog"
  SR: "Lab Result: Hemoglobin A1C"
  SR: "Value: 6.2 percent"
  SR: "Date: October 15, 2025"
  SR: "Provider: Kaiser Permanente"
  SR: "View full record, link"
  SR: "Close, button"
```

---

## 6. Chart & Data Visualization Accessibility

Charts are among the hardest elements to make accessible. SVG charts are essentially invisible to screen readers without explicit effort. PHRI needs three layers of chart accessibility.

### Layer 1: Structured Text Alternative

Wrap every chart in a `<figure>` with a description that conveys the INSIGHT, not just the data:

```html
<figure aria-label="Lisinopril dosage history chart">
  <!-- Chart SVG — hidden from screen readers -->
  <div role="img" aria-hidden="true">
    <ResponsiveContainer>
      <AreaChart data={dosageHistory}>
        <!-- Recharts chart -->
      </AreaChart>
    </ResponsiveContainer>
  </div>
  
  <!-- Screen reader description — insight-first -->
  <figcaption class="sr-only">
    Lisinopril dosage over time: Started at 5 milligrams in January 2024,
    increased to 10 milligrams in April 2024, where it has remained through
    the current date. The medication has been active for 12 months with one
    dosage change.
  </figcaption>
</figure>
```

**Key principle:** The text alternative should convey what a sighted user would LEARN from the chart — trends, patterns, notable changes — not just recite data points. "Started at 5mg, increased to 10mg in April" is better than "January: 5mg, February: 5mg, March: 5mg, April: 10mg, May: 10mg..."

### Layer 2: Accessible Data Table

Provide an expandable data table containing the same data shown in the chart. Use `<details>` for progressive disclosure:

```html
<details>
  <summary>View dosage data as table</summary>
  <table>
    <caption>Lisinopril dosage history — 5 records from January 2024 to present</caption>
    <thead>
      <tr>
        <th scope="col">Date</th>
        <th scope="col">Dosage</th>
        <th scope="col">Status</th>
        <th scope="col">Provider</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Jan 12, 2024</td>
        <td>5 mg, once daily</td>
        <td>
          <span aria-label="Active">
            <!-- Green dot icon (decorative — aria-hidden) -->
            <svg aria-hidden="true">...</svg>
            Active
          </span>
        </td>
        <td>Kaiser Permanente</td>
      </tr>
      <!-- ... more rows ... -->
    </tbody>
  </table>
</details>
```

**Table accessibility rules:**
- `<caption>` summarizes the table purpose and scope
- `<th scope="col">` on every column header
- `<th scope="row">` if the first column uniquely identifies each row
- Never use `<td>` for headers
- Status columns include text labels, not just icons/colors

### Layer 3: Keyboard-Navigable Chart (Recharts accessibilityLayer)

Recharts has an `accessibilityLayer` prop that enables keyboard navigation of data points. When enabled, users can Tab into the chart and use Arrow keys to move between data points, with tooltips announced as live regions.

```tsx
<AreaChart data={dosageHistory} accessibilityLayer>
  <Area type="stepAfter" dataKey="dosageMg" />
  <XAxis dataKey="date" />
  <YAxis />
  <Tooltip
    content={({ active, payload }) => (
      // Custom tooltip — this content is in a live region
      <div role="status">
        {active && payload?.[0] && (
          <p>{payload[0].payload.date}: {payload[0].value}mg</p>
        )}
      </div>
    )}
  />
</AreaChart>
```

**Recharts accessibility notes:**
- `accessibilityLayer` adds `tabIndex="0"` and arrow key handlers to the chart
- Tooltip content lives in an `aria-live="polite"` region — screen readers announce tooltip changes
- Left/Right arrows move between data points
- The chart receives focus via Tab, and exits via Tab (does not trap)

### Lab Value Charts — Reference Range Accessibility

For lab charts with normal range shading, the text alternative must include range context:

```
Screen reader text:
"Blood glucose over time: 5 measurements from June 2024 to January 2025.
 Values ranged from 88 to 112 milligrams per deciliter.
 The typical range is 70 to 100 milligrams per deciliter.
 3 of 5 readings were within the typical range.
 The October and January readings of 108 and 112 were slightly above the typical range."
```

### Color-Blind Safe Chart Patterns

For charts with multiple data series (e.g., comparing two medications), supplement color with:

1. **Distinct stroke patterns:** Use `strokeDasharray` — solid for one series, dashed (`"8 4"`) for another, dotted (`"2 2"`) for a third
2. **Shape markers:** Different dot shapes at data points — circle, square, triangle, diamond
3. **Direct labels:** Label each line directly on the chart rather than relying on a color-coded legend

```tsx
<Line dataKey="lisinopril" stroke="oklch(0.59 0.155 210)" strokeDasharray="" dot={<CircleDot />} />
<Line dataKey="metformin" stroke="oklch(0.70 0.14 70)" strokeDasharray="8 4" dot={<SquareDot />} />
```

---

## 7. Streaming Chat Accessibility

The AI chat is the most challenging accessibility surface in the app. Streaming text, inline citations, conversation history, and medical disclaimers all need careful ARIA work.

### Chat Container Structure

```html
<main id="main-content">
  <h1 class="sr-only">Health Assistant</h1>
  
  <!-- Message history — scrollable region -->
  <div role="log" aria-label="Conversation" aria-live="off" tabindex="0"
       aria-describedby="chat-disclaimer">
    <!-- aria-live="off" on the log — we use a separate region for announcements -->
    
    <!-- Medical disclaimer (always visible) -->
    <p id="chat-disclaimer" class="text-sm text-muted">
      AI assistant for informational purposes only. Not medical advice.
    </p>
    
    <!-- Messages -->
    <div role="article" aria-label="You said">
      <p>What were my latest lab results?</p>
    </div>
    
    <div role="article" aria-label="Assistant response">
      <p>Your most recent lab work from October 15, 2025 included...</p>
      <!-- Citation markers are buttons -->
      <button aria-label="Citation 1: Lab Result, Hemoglobin A1C, October 2025"
              aria-haspopup="dialog">[1]</button>
    </div>
  </div>
  
  <!-- Streaming status — separate live region -->
  <div role="status" aria-live="polite" class="sr-only" id="chat-status">
    <!-- Updated by JS -->
  </div>
  
  <!-- Input area -->
  <div role="form" aria-label="Send a message">
    <label for="chat-input" class="sr-only">Ask about your health records</label>
    <textarea id="chat-input" aria-describedby="chat-input-help"
              placeholder="Ask about your health records..."></textarea>
    <p id="chat-input-help" class="sr-only">
      Press Enter to send. Press Shift+Enter for a new line.
    </p>
    <button type="submit" aria-label="Send message">
      <svg aria-hidden="true"><!-- send icon --></svg>
    </button>
  </div>
</main>
```

### Streaming Text — The Live Region Problem

The core challenge: streaming text arrives token-by-token (dozens of updates per second). If the chat container were `aria-live="polite"`, the screen reader would try to announce every single token — creating an incomprehensible flood of speech.

**Solution: Debounced sentence-level announcements in a SEPARATE live region.**

```typescript
// useChatAccessibility.ts
function useChatAccessibility() {
  const statusRef = useRef<HTMLDivElement>(null);
  const lastAnnouncedRef = useRef("");
  const debounceTimerRef = useRef<NodeJS.Timeout>();

  const announceStreamingStatus = useCallback((fullText: string) => {
    // Phase 1: "Thinking" indicator before any text arrives
    if (fullText.length === 0) {
      if (statusRef.current) {
        statusRef.current.textContent = "Assistant is thinking...";
      }
      return;
    }

    // Phase 2: Announce complete sentences as they form
    // Find the last complete sentence (ends with . ? ! followed by space or end)
    const sentences = fullText.match(/[^.!?]+[.!?]+/g) || [];
    const lastCompleteSentence = sentences[sentences.length - 1]?.trim();
    
    if (lastCompleteSentence && lastCompleteSentence !== lastAnnouncedRef.current) {
      // Debounce to avoid rapid-fire announcements
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        if (statusRef.current) {
          statusRef.current.textContent = lastCompleteSentence;
          lastAnnouncedRef.current = lastCompleteSentence;
        }
      }, 500); // 500ms debounce — lets sentences complete
    }
  }, []);

  const announceStreamingComplete = useCallback(() => {
    clearTimeout(debounceTimerRef.current);
    if (statusRef.current) {
      statusRef.current.textContent = "Response complete. Use Tab to navigate citations.";
    }
  }, []);

  const announceError = useCallback((message: string) => {
    if (statusRef.current) {
      // Use assertive for errors — they're important
      statusRef.current.setAttribute("aria-live", "assertive");
      statusRef.current.textContent = message;
      // Reset to polite after announcement
      setTimeout(() => {
        statusRef.current?.setAttribute("aria-live", "polite");
      }, 100);
    }
  }, []);

  return { statusRef, announceStreamingStatus, announceStreamingComplete, announceError };
}
```

### Chat Keyboard Navigation

```
Tab flow:
1. Chat session list (if sidebar open on desktop)
   1a. Each session is a button
   1b. Arrow Up/Down to navigate sessions
   1c. Enter to select
2. Message area (role="log", receives focus via Tab)
   2a. Arrow Up/Down to scroll through messages
   2b. Tab moves to first interactive element (citation button) within current viewport
3. Citation buttons within messages
   3a. Tab between citation markers [1], [2], etc.
   3b. Enter/Space opens citation popover
4. Chat input textarea
5. Send button
6. Suggested prompt chips (if present below input)
   6a. Tab between chips
   6b. Enter activates chip (fills input and sends)

Special keys in textarea:
  Enter: sends message (when not Shift-modified)
  Shift+Enter: inserts newline
  Escape: clears input (if non-empty) or closes session sidebar
```

### Session Management Accessibility

```html
<!-- Session list on desktop -->
<aside aria-label="Chat sessions">
  <h2 class="sr-only">Your conversations</h2>
  <button aria-label="Start new conversation">New chat</button>
  
  <nav aria-label="Previous conversations">
    <h3>Today</h3>
    <ul>
      <li>
        <a href="/chat/session-123" aria-current="page">
          <!-- aria-current="page" marks the active session -->
          Lab Results Discussion
          <span class="sr-only">, today at 9:42 AM</span>
        </a>
      </li>
    </ul>
    <h3>Yesterday</h3>
    <ul>...</ul>
  </nav>
</aside>
```

### Suggested Prompts Accessibility

```html
<div role="group" aria-label="Suggested questions">
  <button class="rounded-full" aria-label="Ask: Explain my latest lab results">
    Explain my latest lab results
  </button>
  <button class="rounded-full" aria-label="Ask: Do any of my medications interact?">
    Do any of my medications interact?
  </button>
  <!-- etc. -->
</div>
```

### AI Disabled State

When AI mode is off in settings:

```html
<div role="alert">
  <h2>Chat is currently disabled</h2>
  <p>The AI health assistant is turned off. You can enable it in
     <a href="/settings">Settings</a> under "AI Features."</p>
</div>
```

---

## 8. Citation System Accessibility

Citations are the core trust mechanism. They must be consistently accessible across both data views and chat.

### Citation Marker Pattern

In chat messages, citation markers `[1]` are **buttons** that open popovers:

```html
<p>
  Your hemoglobin A1C was 6.2%
  <button
    aria-label="Citation 1: Lab Result, Hemoglobin A1C, October 2025"
    aria-haspopup="dialog"
    aria-expanded="false"
    class="inline-flex items-center justify-center w-5 h-5 text-xs
           rounded-full bg-primary-100 text-primary-700 hover:bg-primary-200
           focus-visible:ring-2 focus-visible:ring-primary-400"
  >
    1
  </button>
  which is within the typical range.
</p>
```

**Why buttons, not links:** Citations don't navigate to a URL — they reveal supplementary information in a popover. This is a disclosure pattern, not navigation. Buttons are the correct semantic.

### Citation Popover Pattern

When a citation marker is activated, open a Radix Popover:

```html
<div role="dialog" aria-label="Citation 1 details" aria-modal="false">
  <!-- NOT aria-modal="true" — popovers don't trap focus -->
  <div class="flex items-center gap-2">
    <span class="badge" aria-hidden="true">Lab Result</span>
    <span class="sr-only">Record type: Lab Result</span>
    <span>Hemoglobin A1C</span>
  </div>
  <dl>
    <dt class="sr-only">Value</dt>
    <dd>6.2%</dd>
    <dt class="sr-only">Date</dt>
    <dd>October 15, 2025</dd>
    <dt class="sr-only">Provider</dt>
    <dd>Kaiser Permanente</dd>
  </dl>
  <a href="/timeline/record-123">View full record</a>
</div>
```

**Popover keyboard behavior:**
- Escape closes the popover, returns focus to the citation marker
- Tab navigates within the popover (to "View full record" link)
- Tab beyond the last element closes the popover and moves to next focusable element
- Popover does NOT trap focus (it's supplementary, not modal)

### Data View Citations

In timeline/medication/immunization lists, citation info is embedded in the item itself:

```html
<li>
  <button aria-label="Observation: Blood Glucose, 95 milligrams per deciliter,
    October 15, 2025, from Kaiser Permanente. Press Enter for details.">
    <!-- Visual card content -->
    <span aria-hidden="true"><!-- Resource type badge --></span>
    <span>Blood Glucose</span>
    <span>95 mg/dL</span>
    <span>Oct 15, 2025</span>
    <span>Kaiser Permanente</span>
  </button>
</li>
```

The source attribution ("from Kaiser Permanente") is always included in the accessible name so screen reader users know data provenance without opening the detail view.

---

## 9. Zoom, Reflow & Responsive Accessibility

### WCAG 1.4.10 Reflow Requirements

Content must work at **320 CSS pixels width** (equivalent to 1280px desktop at 400% zoom) without horizontal scrolling. Exceptions: data tables, charts, and toolbar interfaces.

### Reflow Testing Procedure

```
1. Open the app in Chrome at 1280px window width
2. Zoom to 400% (Ctrl/Cmd + multiple times)
3. OR resize browser to 320px width at 100% zoom
4. Verify for EVERY page:
   - No horizontal scrollbar appears
   - All text is readable without horizontal scrolling
   - All interactive elements are reachable
   - No content is clipped or hidden behind overflow:hidden
   - Forms are usable (labels visible, inputs full-width)
```

### Page-Specific Reflow Strategies

**Dashboard:** Category cards stack vertically in a single column. Summary stats reflow from horizontal row to vertical stack. Quick action buttons become full-width.

**Timeline:** Filter controls stack vertically. Record cards become full-width. Pagination controls wrap.

**Medications:** Search and filter stack vertically. Medication cards become full-width single-column list.

**Medication Insights:** Charts display at full viewport width (exempt from reflow, but must not cause horizontal scroll). Data tables get horizontal scroll within their own container:

```html
<!-- Charts are exempt but contain them properly -->
<div class="w-full overflow-x-auto" role="region" aria-label="Dosage chart, scroll horizontally to view"
     tabindex="0">
  <div class="min-w-[600px]">
    <!-- Chart -->
  </div>
</div>
```

**Chat:** Message bubbles become full-width. Session sidebar converts to full-screen overlay or header dropdown. Input area stays fixed at bottom.

### Text Scaling (WCAG 1.4.4)

All text must remain readable and functional when scaled to 200%. Use `rem` units for all font sizes and spacing — never `px` for text. Tailwind's default scale uses rem, but verify custom values:

```css
/* WRONG */
.label { font-size: 12px; }

/* RIGHT — uses Tailwind's rem-based scale */
.label { @apply text-xs; } /* 0.75rem = 12px at default, scales with user preference */
```

### Touch Target Sizes (WCAG 2.5.8 — Target Size)

Minimum **24×24 CSS pixels** per WCAG 2.5.8 (AA). Recommend **44×44 CSS pixels** for health app context (elderly users, motor impairments). Apply to:

- All buttons (including icon-only buttons like close, send, etc.)
- All checkboxes and toggle switches
- Citation markers `[1]` — minimum 24×24 despite their visual smallness
- Pagination buttons
- Filter chips
- Tab bar items on mobile

```tsx
// Citation button — visually small but has adequate touch target
<button
  className="relative inline-flex items-center justify-center
             w-5 h-5 text-xs           /* Visual size: 20×20 */
             before:absolute before:inset-[-12px] /* Touch target: 44×44 */
             before:content-['']"
  aria-label="Citation 1..."
>
  1
</button>
```

---

## 10. Color & Contrast Compliance

### Minimum Contrast Ratios

| Content Type | Minimum Ratio | WCAG Criterion |
|---|---|---|
| Normal text (<18pt / <14pt bold) | **4.5:1** | 1.4.3 |
| Large text (≥18pt or ≥14pt bold) | **3:1** | 1.4.3 |
| UI components & graphical objects | **3:1** | 1.4.11 |
| Focus indicators | **3:1** against adjacent colors | 1.4.11 |
| Placeholder text | **4.5:1** (treat as regular text) | 1.4.3 |
| Disabled elements | Exempt | — |

### Verification Tooling

Use these tools to verify OKLch colors meet contrast requirements:

- **OddContrast** (oddbird.net/oddcontrast) — directly accepts OKLch values
- **Atmos Contrast Checker** (atmos.style/contrast-checker) — OKLch support
- **WebAIM Contrast Checker** (webaim.org/resources/contrastchecker) — requires hex conversion
- **Chrome DevTools** — built-in contrast checker in Elements panel, hover over a color swatch

### Focus Indicator Specification

Every focusable element must have a visible focus indicator. Use Tailwind's `focus-visible:` (not `focus:`) to avoid showing focus on mouse clicks:

```css
/* Global focus style — add to your base CSS */
@layer base {
  *:focus-visible {
    outline: 2px solid oklch(0.59 0.155 210); /* Primary-500 */
    outline-offset: 2px;
    border-radius: 4px;
  }
}

/* For elements on dark backgrounds, use a light focus ring */
.dark *:focus-visible,
[data-dark] *:focus-visible {
  outline-color: oklch(0.72 0.13 210); /* Primary-400, lighter for dark mode */
}
```

The focus indicator must have **3:1 contrast** against BOTH the element's background AND adjacent colors. On a white card (`oklch(1 0 0)`), the primary-500 (`oklch(0.59 0.155 210)`) focus ring has approximately 4.7:1 contrast — passing.

### High Contrast Mode

Support `forced-colors` media query for Windows High Contrast Mode:

```css
@media (forced-colors: active) {
  /* Override custom colors to use system colors */
  .badge, .status-indicator {
    border: 1px solid ButtonText;
  }
  
  /* Ensure focus rings use system highlight color */
  *:focus-visible {
    outline: 2px solid Highlight;
  }
  
  /* Charts become meaningless — show data table instead */
  .chart-container { display: none; }
  .chart-data-table { display: block; }
}
```

---

## 11. Motion & Animation Accessibility

### Reduced Motion

Respect the `prefers-reduced-motion` media query. When set, replace all animations with instant state changes or simple opacity fades:

```typescript
// useReducedMotion.ts
import { useEffect, useState } from "react";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}
```

**Usage in Motion (Framer Motion) components:**

```tsx
import { motion } from "motion/react";
import { useReducedMotion } from "./useReducedMotion";

function PageTransition({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
      transition={reduced ? { duration: 0 } : { duration: 0.25, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}
```

**CSS-level reduced motion (for tw-animate-css):**

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Skeleton Loading — Reduced Motion

Replace `animate-pulse` with a static gray background:

```tsx
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md bg-muted",
        "motion-safe:animate-pulse", // Only animate when motion is OK
        className
      )}
      aria-hidden="true" // Skeletons are decorative
    />
  );
}
```

Additionally, add a screen-reader-only loading message:

```html
<div role="status" class="sr-only">Loading your medications...</div>
<!-- Visual skeletons (hidden from SR) -->
<div aria-hidden="true">
  <Skeleton className="h-20 w-full" />
  <Skeleton className="h-20 w-full" />
</div>
```

### Streaming Text Cursor

The blinking cursor in chat streaming must respect reduced motion:

```css
.streaming-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: currentColor;
  animation: blink 1s step-end infinite;
}

@media (prefers-reduced-motion: reduce) {
  .streaming-cursor {
    animation: none;
    opacity: 0.7; /* Static cursor, slightly transparent */
  }
}

@keyframes blink {
  50% { opacity: 0; }
}
```

---

## 12. Form & Input Accessibility

### Login/Sign-Up Form

```html
<form aria-label="Sign in to your account" novalidate>
  <div>
    <label for="email">Email address</label>
    <input
      id="email"
      type="email"
      required
      aria-required="true"
      aria-invalid="false"
      aria-describedby="email-error"
      autocomplete="email"
    />
    <!-- Error message — hidden until validation fails -->
    <p id="email-error" role="alert" class="text-error-600" hidden>
      Please enter a valid email address
    </p>
  </div>
  
  <div>
    <label for="password">Password</label>
    <div class="relative">
      <input
        id="password"
        type="password"
        required
        aria-required="true"
        aria-describedby="password-error"
        autocomplete="current-password"
      />
      <button
        type="button"
        aria-label="Show password"
        aria-pressed="false"
        onclick="togglePasswordVisibility()"
      >
        <svg aria-hidden="true"><!-- eye icon --></svg>
      </button>
    </div>
    <p id="password-error" role="alert" hidden>
      Password must be at least 8 characters
    </p>
  </div>
  
  <button type="submit">Sign in</button>
</form>
```

**Validation pattern:**
1. Do NOT validate on blur (causes anxiety and confusion for screen readers)
2. Validate on submit
3. On error: set `aria-invalid="true"` on the field, unhide the error message with `role="alert"` (assertive announcement), move focus to the FIRST invalid field
4. Error message text is specific: "Please enter a valid email address" not "Invalid input"

### Consent Checkboxes

```html
<fieldset>
  <legend>Data consent</legend>
  
  <div>
    <input
      type="checkbox"
      id="consent-storage"
      aria-describedby="consent-storage-desc"
    />
    <label for="consent-storage">
      I understand my health data will be stored securely
    </label>
    <p id="consent-storage-desc" class="text-sm text-muted">
      Your data is encrypted at rest and in transit. You can delete it at any time.
    </p>
  </div>
  
  <!-- Repeat for other consent items -->
</fieldset>
```

### Destructive Action Dialogs

**Tier 2 — Disconnect Health Data:**

```html
<div role="alertdialog" aria-modal="true"
     aria-labelledby="disconnect-title"
     aria-describedby="disconnect-desc">
  <h2 id="disconnect-title">Disconnect your health records?</h2>
  <p id="disconnect-desc">
    This will remove 156 health records from your account.
    Your chat history will be preserved. This action cannot be undone.
  </p>
  <div>
    <!-- Safe action has autofocus -->
    <button autofocus>Keep my records</button>
    <button class="destructive">Disconnect and remove records</button>
  </div>
</div>
```

**Tier 3 — Delete All Data (type "DELETE" confirmation):**

```html
<div role="alertdialog" aria-modal="true"
     aria-labelledby="delete-title"
     aria-describedby="delete-desc">
  <h2 id="delete-title">Permanently delete all your data?</h2>
  <div id="delete-desc">
    <p>This will permanently delete:</p>
    <ul>
      <li>156 health records</li>
      <li>5 chat conversations</li>
      <li>All connected data sources</li>
      <li>Your account preferences</li>
    </ul>
    <p>This action cannot be undone. There is no recovery period.</p>
  </div>
  
  <div>
    <label for="delete-confirm">
      Type <strong>DELETE MY DATA</strong> to confirm
    </label>
    <input
      id="delete-confirm"
      type="text"
      aria-describedby="delete-confirm-help"
      autocomplete="off"
      spellcheck="false"
    />
    <p id="delete-confirm-help" class="sr-only">
      You must type the exact phrase DELETE MY DATA in capital letters to enable the delete button
    </p>
  </div>
  
  <div>
    <button autofocus>Cancel</button>
    <button class="destructive" aria-disabled="true">
      Delete everything
    </button>
  </div>
</div>
```

**Focus management for all dialogs:**
1. When dialog opens: focus moves to the first focusable element (Cancel button for destructive dialogs)
2. Tab is trapped within the dialog
3. Escape closes the dialog (same as Cancel)
4. When dialog closes: focus returns to the button that opened it

### Search Inputs with Debounce

```html
<div role="search" aria-label="Search medications">
  <label for="med-search" class="sr-only">Search medications by name</label>
  <input
    id="med-search"
    type="search"
    role="searchbox"
    aria-describedby="search-results-status"
    placeholder="Search medications..."
    autocomplete="off"
  />
  <!-- Clear button — only visible when input has content -->
  <button aria-label="Clear search" hidden>
    <svg aria-hidden="true"><!-- x icon --></svg>
  </button>
</div>

<!-- Results count — announced after debounce completes -->
<div id="search-results-status" role="status" aria-live="polite" class="sr-only">
  3 medications match "Lisin"
</div>
```

---

## 13. Cognitive Accessibility & Health Literacy

### Reading Level Targets

All patient-facing text should be at a **6th–8th grade reading level**. This includes:
- Error messages
- Status descriptions
- Medical terminology explanations
- Consent language
- Chat disclaimers
- Empty state messages

**Verification:** Run all static strings through a readability scorer (Flesch-Kincaid grade level target: ≤8).

### Plain Language Medical Glossary

Build a reusable component that detects medical terminology and provides inline definitions:

```html
<!-- Medical term with expandable definition -->
<span>
  Your <button aria-expanded="false" aria-controls="def-hba1c"
    class="underline decoration-dotted cursor-help">
    hemoglobin A1C
  </button>
  <span id="def-hba1c" role="tooltip" hidden>
    A blood test that shows your average blood sugar level over the past 2–3 months.
    Sometimes called HbA1c or A1C.
  </span>
  was 6.2%.
</span>
```

### Loading State Communication

Never leave the user wondering what's happening. Every async operation needs a clear status indicator:

```
GOOD:
  "Retrieving your health records from Kaiser Permanente... This usually takes 15–30 seconds."
  "Almost done — we're processing 159 records."
  "Your records are ready!"

BAD:
  (blank screen)
  (spinner with no text)
  "Loading..."
  "Please wait."
```

### Error State Communication

Errors should explain what happened, what the user can do, and provide reassurance:

```
GOOD:
  "We couldn't retrieve your records right now.
   This is usually temporary. You can try again, or come back in a few minutes.
   Your existing data is safe and unchanged."

BAD:
  "Error 500"
  "Failed to fetch"
  "Something went wrong"
```

### Information Overload Prevention

The timeline page shows up to 159 records. Without careful design, this creates cognitive overload. Accessibility strategies:

1. **Progressive disclosure:** Show summary cards by default, full details on demand
2. **Clear filtering:** Prominent, easy-to-use filters that narrow results
3. **Meaningful grouping:** Group by time period or category, not arbitrary pagination
4. **Consistent layout:** Every card in a list looks identical — varying layouts increase cognitive load
5. **Results count always visible:** "Showing 20 of 159 records" reduces anxiety about missing data

---

## 14. Mobile & Touch Accessibility

### Bottom Tab Bar Accessibility

```html
<nav aria-label="Main navigation">
  <ul role="tablist">
    <li role="presentation">
      <a href="/dashboard" role="tab" aria-selected="true" aria-current="page">
        <svg aria-hidden="true"><!-- home icon --></svg>
        <span>Home</span>
      </a>
    </li>
    <li role="presentation">
      <a href="/records" role="tab" aria-selected="false">
        <svg aria-hidden="true"><!-- folder icon --></svg>
        <span>Records</span>
      </a>
    </li>
    <li role="presentation">
      <a href="/chat" role="tab" aria-selected="false">
        <svg aria-hidden="true"><!-- chat icon --></svg>
        <span>Chat</span>
      </a>
    </li>
    <li role="presentation">
      <a href="/settings" role="tab" aria-selected="false">
        <svg aria-hidden="true"><!-- person icon --></svg>
        <span>Profile</span>
      </a>
    </li>
  </ul>
</nav>
```

**Mobile screen reader specifics:**
- VoiceOver (iOS): Users swipe right to move between tab items
- TalkBack (Android): Users swipe right to move between items, double-tap to activate
- Both read the icon label text ("Home", "Records", etc.)
- `aria-current="page"` causes VoiceOver to announce "current page" and TalkBack to announce "selected"

### Swipe-to-Dismiss on Drawers

For the record detail Sheet, support swipe-to-dismiss on mobile while maintaining keyboard accessibility:

```tsx
<Sheet>
  <SheetContent
    side="bottom"
    // Touch: drag handle at top for swipe-to-dismiss
    // Keyboard: Escape to close
    // Screen reader: "Close" button at top
  >
    <SheetHeader>
      <div className="mx-auto w-12 h-1.5 rounded-full bg-muted"
           aria-hidden="true" /> {/* Visual drag handle — decorative */}
      <SheetClose asChild>
        <button aria-label="Close record details">
          <svg aria-hidden="true"><!-- X icon --></svg>
        </button>
      </SheetClose>
      <SheetTitle>{record.displayText}</SheetTitle>
    </SheetHeader>
    {/* Content */}
  </SheetContent>
</Sheet>
```

### Touch Target Spacing

Adjacent touch targets need at least **8px** spacing to prevent accidental activation. In dense lists (timeline, medications), ensure card tap targets don't abut each other:

```css
/* Minimum spacing between tappable items */
.record-list > li + li {
  margin-top: 0.5rem; /* 8px minimum */
}
```

---

## 15. Manual Testing Protocol

Automated tests catch ~50% of issues. Manual testing catches the rest. Run this protocol before every release.

### Screen Reader Testing Matrix

Test these screen reader + browser combinations:

| Screen Reader | Browser | OS | Priority |
|---|---|---|---|
| **VoiceOver** | Safari | macOS | HIGH — test every release |
| **VoiceOver** | Safari | iOS | HIGH — mobile-first app |
| **NVDA** | Firefox | Windows | HIGH — most common desktop SR |
| **NVDA** | Chrome | Windows | MEDIUM |
| **TalkBack** | Chrome | Android | MEDIUM |
| **JAWS** | Chrome | Windows | LOW — enterprise, expensive |

### Manual Test Script (30 minutes per release)

**Step 1: Navigate by landmarks (2 min)**
- Open VoiceOver rotor (VO+U) → Landmarks
- Verify: main, nav, aside (if applicable) are all present
- Verify each landmark has a unique label

**Step 2: Navigate by headings (3 min)**
- Use VO+Cmd+H (next heading) through the entire page
- Verify: one h1, logical h2/h3 hierarchy, no skipped levels

**Step 3: Tab through entire page (5 min)**
- Tab from first element to last
- Verify: logical order, no keyboard traps, all interactive elements reachable
- Verify: visible focus indicator on every element
- Verify: Escape closes any open dialog/popover

**Step 4: Complete the core user journey (10 min)**
1. Sign in (screen reader only — no mouse)
2. Acknowledge consent
3. Select a persona and connect
4. Wait for progress → arrive at dashboard
5. Navigate to Timeline
6. Apply a filter
7. Open a record detail, read it, close it
8. Navigate to Chat
9. Send a message
10. Listen to the response, activate a citation

**Step 5: Zoom to 400% (5 min)**
- Set browser to 400% zoom
- Navigate each page — no horizontal scrolling
- All content readable and functional

**Step 6: Check color contrast (5 min)**
- Use Chrome DevTools to spot-check contrast ratios on:
  - Body text on white/off-white backgrounds
  - Status badges (active/stopped/error text)
  - Muted/secondary text
  - Focus indicators
  - Chart labels and axis text

---

## 16. Accessibility Checklist by Page

Use this checklist for each page during development and QA.

### Every Page

- [ ] Has exactly one `<h1>`
- [ ] Heading hierarchy is logical (no skipped levels)
- [ ] Has correct landmarks (`<main>`, `<nav>`, etc.)
- [ ] Skip link works and targets `<main>`
- [ ] All images have alt text (or `aria-hidden="true"` if decorative)
- [ ] All form inputs have associated labels
- [ ] All interactive elements have accessible names
- [ ] Focus order is logical
- [ ] Focus indicator is visible on every focusable element
- [ ] No keyboard traps
- [ ] Content reflows at 320px width without horizontal scroll
- [ ] All text meets 4.5:1 contrast against background
- [ ] All UI components meet 3:1 contrast
- [ ] Passes vitest-axe with zero violations
- [ ] Passes Playwright axe audit with zero violations

### Dashboard-Specific

- [ ] Category cards have descriptive accessible names (include counts)
- [ ] Recent activity items are in a labeled list
- [ ] Summary stats are marked up as `<article>` elements with headings

### Timeline-Specific

- [ ] Filter region has `role="search"` or `role="form"` with label
- [ ] Filter changes announce results count via `aria-live="polite"`
- [ ] Record items have complete accessible names (type, title, date, source)
- [ ] Detail Sheet traps focus and restores focus on close
- [ ] Pagination buttons have proper labels and `aria-current="page"`

### Medications-Specific

- [ ] Search input has label and `role="searchbox"`
- [ ] Search results count announced after debounce
- [ ] Status filter is accessible (Select or radio group)
- [ ] Active vs. past sections have headings
- [ ] Empty state has clear, helpful message (not error-style)
- [ ] Each medication card's status uses triple-encoding

### Medication Insights-Specific

- [ ] Every chart has a text alternative describing the INSIGHT
- [ ] Every chart has an accessible data table alternative
- [ ] Charts use Recharts `accessibilityLayer` for keyboard navigation
- [ ] Accordion headers follow WAI-ARIA accordion keyboard pattern
- [ ] Citation links within insights are accessible buttons
- [ ] Methodology section is marked up with proper headings

### Chat-Specific

- [ ] Message area has `role="log"`
- [ ] Streaming status uses debounced sentence-level announcements
- [ ] "Response complete" is announced when streaming finishes
- [ ] Citation markers are buttons with descriptive `aria-label`
- [ ] Citation popovers don't trap focus
- [ ] Chat input has label and keyboard shortcut description
- [ ] Session list items use `aria-current="page"` for active
- [ ] Medical disclaimer is always perceivable (not just visible)
- [ ] Error states are announced assertively

### Settings-Specific

- [ ] AI toggle has `role="switch"` with `aria-checked`
- [ ] Toggle changes announce new state via live region
- [ ] Destructive buttons open `role="alertdialog"` dialogs
- [ ] Destructive dialogs have Cancel as the default focused element
- [ ] "DELETE MY DATA" confirmation input has proper label and description
- [ ] Connection status updates use `aria-live="polite"`

---

## Appendix: Dependencies for Accessibility

### Required Packages

```
vitest-axe                  — Unit-level axe-core testing
@axe-core/react             — Dev-time browser console auditing
@axe-core/playwright        — E2E page-level auditing
@testing-library/react      — Accessible component rendering in tests
@testing-library/user-event — Keyboard interaction simulation
```

### Recommended Browser Extensions (for manual testing)

- **axe DevTools** (Chrome/Firefox) — most comprehensive free scanner
- **WAVE** (Chrome/Firefox) — visual overlay of accessibility issues
- **Accessibility Insights for Web** (Chrome) — Microsoft's tool, excellent for focus order and tab stop analysis
- **HeadingsMap** (Chrome/Firefox) — visualizes heading hierarchy
- **Colour Contrast Analyser** (desktop app) — eyedropper for any on-screen color

### Screen Readers for Testing

- **VoiceOver** — built into macOS and iOS (free)
- **NVDA** — free, open-source Windows screen reader (nvaccess.org)
- **JAWS** — commercial Windows screen reader (if budget allows)
- **TalkBack** — built into Android (free)

---

*This document should be treated as a living specification. Update it as new accessibility requirements emerge, as screen reader support evolves, and as user testing reveals real-world issues that automated tools miss. The goal is not perfection at launch — it's a commitment to continuous improvement in making health data accessible to every person who needs it.*
