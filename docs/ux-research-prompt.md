You are a senior UX researcher and healthcare interaction designer. Your job is to redesign the frontend user experience for PHRI — a Personal Health Record & Insights app that is **already built and functional** — and deliver detailed, implementable instructions that a developer can follow to overhaul it into a polished, production-quality consumer health product.

This is a UX overhaul, not a greenfield design. The app works end-to-end today. Your job is to make it feel like a best-in-class consumer health experience.

Your deliverable must include:
- A healthcare-tailored design language that builds on the existing token system
- Page-by-page layouts with wireframe-level descriptions
- Component architecture for reusable, domain-specific UI pieces
- Navigation and information architecture
- Specific interaction patterns for each feature
- Component library recommendation (we're open to replacing shadcn/ui if something better fits)
- Supplementary library recommendations (charts, animations)

Research best practices from leading consumer health apps (Apple Health, MyChart/Epic, One Medical, Google Health, CommonHealth, Hims, Ro, Forward) and modern React UI ecosystems before making recommendations.

---

# CONTEXT: WHAT'S ALREADY BUILT

## Current Tech Stack (Fixed — not changing)
- **React 19** + TypeScript 5.9
- **React Router 7** for navigation (client-side routing with auth guards)
- **Tailwind CSS 4.2** for styling (OKLch color space, CSS variable tokens)
- **shadcn/ui** (New York style) + **Radix UI** primitives — currently used (20 components built), but **open to replacing** if a better library fits this domain
- **Lucide React** for icons
- **Sonner** for toast notifications
- **date-fns** for date formatting
- **react-markdown** for rendering AI chat responses
- **Supabase** for auth (JWT)
- **Vite 7** for build tooling
- Backend API is fixed (all endpoints and data shapes are set)

## What's Open for Recommendation
- **Component library** — currently shadcn/ui + Radix, but open to ANY React-compatible open-source library (Mantine, Ant Design, MUI, Chakra, Park UI, Ark UI, NextUI, or others). Evaluate what's best for a consumer health app.
- **Chart/visualization library** — nothing installed yet, critically needed for medication insights
- **Animation library** — only `tw-animate-css` currently, may need more
- **Icon library** — currently Lucide, open to alternatives
- **Toast/notification system** — currently Sonner, open to alternatives
- Design token overhaul (colors, typography, spacing) — current tokens are generic defaults
- Any other supplementary UI dependencies

## Current Design Tokens (what exists today)
The app uses shadcn/ui's default neutral palette — **no healthcare-specific colors**:
```css
/* Light mode */
--primary: oklch(0.205 0 0);           /* Near-black */
--secondary: oklch(0.97 0 0);          /* Light gray */
--destructive: oklch(0.577 0.245 27.325); /* Red */
--border: oklch(0.922 0 0);            /* Very light gray */
--radius: 0.625rem;                    /* Base border radius */

/* 5 chart color slots defined but unused */
--chart-1 through --chart-5

/* Dark mode variables defined but not activated */
/* next-themes installed but toggle not wired up */

/* Sidebar tokens exist */
--sidebar, --sidebar-foreground, --sidebar-primary, etc.
```

## Current App Structure
- **11 pages**: Login, Consent, Connect, Progress, Dashboard, Timeline, Medications, Medication Insights, Immunizations, Chat, Settings
- **Navigation**: Fixed left sidebar (56px) with icon nav, hamburger sheet on mobile
- **Route guards**: PublicOnly → RequireAuth → RequireConsent → RequirePatient
- **State management**: React Context (auth) + local useState per page
- **API layer**: Custom fetch wrapper with Bearer JWT token injection

## What Needs Improvement
The app is functional but uses default shadcn/ui styling with no healthcare personality. It looks like a generic SaaS dashboard. Specific pain points:
- No visual identity — default neutral gray everything
- No data visualization (medication insights need charts)
- Mobile experience is minimal
- No animations or micro-interactions
- Dark mode tokens exist but aren't activated
- Loading/empty/error states are basic
- Citation popovers are functional but not polished
- Chat UI is basic (no suggested prompts, plain message bubbles)

---

# EVALUATION CONTEXT

This app is being evaluated by a hiring team at a health-tech company. The top evaluation criteria are:

1. **Product Thinking & UX** — Is the app intuitive and polished? Does it handle edge cases and failure states gracefully?
2. **Insight Quality** — Are computed insights genuinely useful, clearly explained, and traceable to source data?
3. **Architecture & Technical Depth** — Sound system design, clean code, good patterns

**The UX is the primary differentiator.** The backend and data pipeline are solid. The frontend needs to go from "works" to "impressive." Every design recommendation should optimize for polish, trust, and delight.

---

# THE APP: PHRI (Personal Health Record & Insights)

## What It Does
PHRI is a consumer-facing web app that lets people:
1. Connect to health data networks and retrieve their electronic health records (FHIR R4 standard)
2. Browse their clinical data through intuitive, filterable views
3. Get computed insights — e.g., medication duplicate detection across providers, dosage change tracking over time
4. Ask an AI chatbot questions about their health records and get answers grounded in cited sources
5. Control their data — explicit consent, AI toggle, disconnect, full deletion

## Who Uses It
- Everyday health-conscious consumers, NOT clinicians
- People who want to understand their health records in plain language
- Users who may feel anxious about medical data — trust, clarity, and calm are critical
- Mix of tech-savvy and non-technical
- Mobile-first usage, desktop-capable

---

# REQUIREMENTS: USER JOURNEY

The app enforces a mandatory sequential flow. Each step must complete before the next unlocks.

### Step 1: Sign In / Sign Up
- Email + password authentication
- Toggle between sign-in and sign-up modes on the same page
- After successful auth → redirect to consent (if not yet given)

### Step 2: Data Consent
- User must explicitly acknowledge 3 items:
  1. Health data will be fetched from networks and stored securely for generating insights
  2. Health data may be processed by AI (Claude) to power the chat feature
  3. User can delete all their data at any time
- All 3 must be checked before the submit button enables
- After consent → redirect to connect

### Step 3: Connect a Health Record
- In sandbox mode: choose from 5 test personas with different profiles:
  - Jane (30F, ~159 records), Chris (30M, ~159 records), Ollie (80M, extensive encounters), Kyla (99F, ~168 records), Andreas (74M, limited data)
- In production: this would be real health network authorization (OAuth-style)
- Select persona → click connect → redirect to progress

### Step 4: Data Retrieval Progress
- Backend retrieves records asynchronously (takes 15-30 seconds)
- Frontend polls status every 3 seconds
- Status transitions: pending → querying → partial (user can proceed early) → ready (auto-redirect to dashboard) → failed (retry option)
- This screen needs to feel reassuring, not anxiety-inducing

### Step 5: Main App
7 primary sections (detailed below) + settings

---

# REQUIREMENTS: MAIN APP FEATURES

## Feature 1: Dashboard (Home Page)

**What it shows** (from `GET /api/dashboard`):
- Patient name, connection status, last sync time
- Summary counts: conditions, observations, encounters, immunizations, procedures, diagnostic reports, medications (with active count), allergies, total resources
- Recent activity: latest health events (each with: id, resourceType, displayText, dateRecorded, source)

**What the user needs**:
- Quick orientation: "What's in my health record?"
- Entry points to explore specific data categories
- Awareness of recent changes or notable items
- This is the landing page — it must reduce overwhelm, not create it

## Feature 2: Timeline (All Health Events)

**What it shows** (from `GET /api/timeline`):
- Chronological list of ALL health events across 8 FHIR resource types
- Each item: id, resourceType, displayText, dateRecorded, source, citation
- Filterable by: resource type (dropdown), date range (from/to)
- Paginated: 20 items per page
- Click any item → detail view with structured FHIR fields + raw JSON
- Filters sync to URL params for bookmarking

**Resource types**: Condition, DiagnosticReport, Encounter, Immunization, Observation, Procedure, MedicationRequest, AllergyIntolerance

**What the user needs**:
- ~159 records across 8 types — need to find what matters fast
- Medical terminology must be made approachable
- Serves both quick scanning and deep exploration
- Detail view shows different structured fields per resource type:
  - Condition → clinical status, condition code
  - Observation → value with unit, reference range
  - Encounter → class, period dates
  - Immunization → vaccine code, status
  - Procedure → procedure code, performed date
  - DiagnosticReport → report code, conclusion

## Feature 3: Medications

**What it shows** (from `GET /api/medications`):
- Medications grouped into: active[] and other[]
- Each: id, name, status (active/stopped/completed), dosage, dateRecorded, source, citation
- Filterable by status, searchable by name (debounced)
- Click → detail view with full FHIR MedicationRequest data
- Note: sandbox personas have 0 medications — empty state is the default demo experience

**What the user needs**:
- Medications are high-stakes — users care deeply about what they're taking
- Active vs. stopped must be immediately visually distinct
- Empty state must be informative ("No medications found in your records" not "Error")

## Feature 4: Medication Insights (Computed Analysis)

**What it shows** (from `GET /api/medications/insights`):
- Summary stats: total unique medications, active count, stopped count
- Duplicate detection: same drug appearing in records from different providers/dates
  - Grouped by drug name, each with occurrences [{id, date, source, dosage, citation}]
- Dosage change tracking: how a medication's dosage/status changed over time
  - Grouped by drug, history entries [{id, date, dosage, status, citation}]
- Methodology disclosure: {description, steps[], limitations[]}

**What the user needs**:
- This is the "value-add" feature — it should feel genuinely insightful, not just a data reorganization
- Transparency: users must see HOW insights were computed (methodology) and what the LIMITATIONS are
- Every data point must trace back to its source record (citation drill-down)
- Duplicates help catch discrepancies across providers
- **Visualization is critical here** — dosage changes over time need a real chart/timeline visualization, not just a list. This is the one place in the app that MUST have data visualization. Recommend a specific chart library and chart type.

## Feature 5: Immunizations

**What it shows** (from `GET /api/immunizations`):
- List of immunization records with: id, name, status, dateRecorded, source, citation
- Total count
- Searchable by name (debounced)
- Click → detail view with full FHIR Immunization data

**What the user needs**:
- Practical use case: "When was my last tetanus shot?" for travel/school/work
- Chronological grouping (by year) with clear visual hierarchy
- Quick search to find specific vaccines

## Feature 6: AI Chat (RAG-Powered Q&A)

**How it works**:
- `POST /api/chat` → Server-Sent Events stream:
  - Multiple `text_delta` events (text builds up incrementally)
  - One `citations` event (array of source references)
  - One `done` event (with sessionId + messageId)
  - Or `error` event
- `GET /api/chat/sessions` → list of past conversations [{id, createdAt, preview}]
- `GET /api/chat/sessions/:id` → full message history [{id, role, content, citations, createdAt}]

**Citation shape**: {index, resourceType, fhirResourceId, excerpt, date}
- Inline markers [1], [2] in response text reference specific health records
- Each citation links to the source FHIR resource for verification

**What the user needs**:
- Chat is the flagship feature — it should feel helpful and trustworthy, not clinical
- Citations differentiate this from generic chatbots — they need to be prominent but not distracting
- Streaming needs clear visual feedback (typing indicator, progressive text reveal)
- Users should be guided on what to ask (suggested prompts, conversation starters)
- Backend enforces medical advice refusal — frontend should reinforce this is informational, not diagnostic
- Session history lets users return to previous conversations
- When AI mode is disabled in settings, chat shows a clear explanation + link to settings
- Enter sends, Shift+Enter for newline
- Markdown rendering for structured responses (lists, bold, headers)

## Feature 7: Settings

**What it shows** (from `GET/PATCH /api/settings`):
- Connected record info: persona name, status, last sync time
- AI mode toggle (on/off) — controls whether chat feature works
- Disconnect patient: removes health data but keeps chat history (confirmation dialog)
- Delete ALL data: cascade deletes everything (requires typing "DELETE" to confirm)

**What the user needs**:
- Data control is a trust feature — deletion options should be accessible, not buried
- Destructive actions need clear, appropriate warnings
- AI toggle needs explanation of what it controls
- Connection status at a glance

---

# STRETCH FEATURES (Design for these too)

These are not yet built but should be included in the design spec for future implementation:

## Medical Record Summary View
- A consolidated, plain-language summary of the user's entire health record
- Think: "executive summary" of your health data
- Could use AI to generate a narrative summary, or structured sections (active conditions, recent visits, current medications, allergies)
- Should be accessible from the dashboard as a primary CTA

## Immunization & Lab Deep-Dive Insights
- Similar to the medication insights feature but for immunizations and diagnostic reports/observations
- Immunization insights: vaccine schedule completeness, overdue boosters, travel-readiness
- Lab insights: trend analysis for repeated observations (e.g., cholesterol over time, blood pressure trends)
- These would need visualization — line charts for lab trends, timeline for vaccine history

---

# CROSS-CUTTING: CITATION SYSTEM

Every clinical fact in the app has a citation tracing it to the source FHIR record. This is the core trust mechanism.

**Two citation data shapes**:
1. Data view citations (timeline, meds, immunizations): {resourceType, resourceId, excerpt, date, source}
2. Chat citations (different): {index, resourceType, fhirResourceId, excerpt, date} — no source field

**The interaction pattern needs to support**:
- "I see a health fact" → "I can check its source" → "I can see the raw clinical data"
- Progressive disclosure: don't overwhelm with source info, but make it always accessible
- Consistent across all views (data pages + chat)
- On dense pages (timeline with 20 items), source indicators shouldn't create visual noise

---

# YOUR DELIVERABLE

Produce a complete, implementable frontend design specification:

### 1. Design Language (build on existing tokens)
- Healthcare-specific color system — replace the generic neutral palette with colors that communicate trust, calm, and medical context. Provide exact OKLch values that slot into the existing CSS variable system.
- Semantic status colors: active (medication), stopped, completed, failed, pending, partial
- Resource type color coding (8 FHIR types need distinct but harmonious colors)
- Typography scale and font recommendations
- Spacing and layout grid system
- Border radius, shadow, and elevation patterns
- Dark mode activation strategy (tokens exist, just need to wire up the toggle)
- Health-specific visual patterns (how to make it feel like a health app, not a SaaS dashboard)

### 2. Component Library Recommendation
- Evaluate open-source React component libraries for this use case
- Consider: shadcn/ui (current), Mantine, Ant Design, MUI, Chakra UI, Park UI, Ark UI, NextUI, or others
- Recommend ONE primary library and justify why it's the best fit for a consumer health app
- Note what we'd gain vs the cost of switching from shadcn/ui (20 components already wired up)
- All must work with React 19 + Tailwind CSS 4

### 3. Supplementary Libraries
- **Chart/visualization library** — Recommend ONE library that works with React 19 + Tailwind. Consider: Recharts, Nivo, Victory, Chart.js/react-chartjs-2, Tremor, or others. Justify the choice for this specific use case (medication timeline, lab trends, summary stats).
- **Animation library** — Recommend whether to use Framer Motion, React Spring, or stick with CSS/tw-animate-css. Consider page transitions, micro-interactions, skeleton loading, streaming text reveal.
- **Icons** — Stick with Lucide or switch? Justify.
- **Toast/notifications** — Stick with Sonner or switch? Justify.
- Any other supplementary dependencies needed.
- All must work with React 19 + Tailwind CSS 4.

### 4. Page-by-Page Design (implementable wireframe descriptions)
For each page (Login, Consent, Connect, Progress, Dashboard, Timeline, Medications, Medication Insights, Immunizations, Chat, Settings, plus stretch features):
- Layout structure (what goes where, responsive breakpoints)
- Component breakdown (which library components to use, referencing the recommended library)
- Interaction patterns (clicks, hovers, transitions, animations)
- Information hierarchy (what's most prominent, what's secondary)
- Mobile-specific adaptations (the current mobile experience is minimal — make it great)
- Loading, empty, and error states (these are a key differentiator for polish)
- Specific CSS/Tailwind patterns to achieve the layout

### 5. Reusable Component Architecture
- Healthcare-specific components to build (beyond library primitives):
  - Clinical data display (different rendering per resource type)
  - Citation interaction component (consistent across views)
  - Detail panel/drawer component (currently a basic Sheet)
  - Data visualization components (medication timeline, lab trends)
  - Status indicators (active/stopped/completed/failed)
  - Health event cards
  - Streaming chat message component with citation markers
  - Medical record summary card
- Props, composition patterns, and when to use each

### 6. Navigation & Information Architecture
- Evaluate the current sidebar pattern — is it the best choice? Consider alternatives (top nav, tab bar, hybrid)
- Mobile navigation approach (current hamburger → sheet is basic)
- How users discover and move between sections
- Breadcrumb/context patterns for drill-down views (timeline → detail)
- Consider the mental model: users think about "my conditions", "my medications", "my visits" — not "FHIR resource types"

### 7. Chat UX Specification
- Message layout and styling (current is plain)
- Citation display pattern (inline markers + detail view)
- Streaming text animation/feedback
- Suggested prompts / conversation starters (specific to health data context)
- Session list UX (current left sidebar is basic)
- Empty state (first-time user — this is an opportunity to guide)
- Trust signals (disclaimers, source attribution)
- Mobile chat experience (session list + chat on same screen?)

### 8. Accessibility & Trust Design
- WCAG AA compliance patterns
- Health-anxious user considerations
- How the design communicates: safety, accuracy, user control, data privacy
- Consent UX that feels reassuring, not legalistic
- Destructive action safeguards (current: type "DELETE" — is this the best pattern?)
- How the overall design earns and maintains user trust with sensitive health data

Be opinionated. Recommend ONE best approach for each decision, with justification. The output should be detailed enough that a developer can take your spec and implement it directly.
