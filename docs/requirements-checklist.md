# Dereq Quinn - Health Data Insights - Take Home Assessment

**Date:** February 21, 2026
**Document Type:** Assessment

## Overview

Build a consumer "personal health record + insights" web app using the Metriport Medical API. Users can enter their information, retrieve their records, and explore it through an interactive UI, and use a safe, cited AI chat grounded in their data.

**Time box:** 20–35 hours. Stop at ~35 hours; write "what I'd do next."

**Docs:**
- Quickstart: https://docs.metriport.com/medical-api/getting-started/quickstart
- FHIR overview: https://docs.metriport.com/medical-api/fhir/overview
- Medical Record Summary: https://docs.metriport.com/medical-api/handling-data/medical-record-summary

---

## What to build

### Minimum (required)

#### UI Flow (Feel free to change)

- [x] **Sign in** (any method) and enforce user isolation.
  - Each authenticated user can only see and interact with their own data
    - Frontend: Route guards (RequireAuth → RequireConsent → RequirePatient) gate access. All API calls go through centralized `apiFetch()` with no user IDs in URLs — backend determines identity from JWT.
    - Backend: Every service method receives `userId` (extracted from JWT `sub` claim) and filters all queries by it. E.g., `getTimeline(userId)` looks up patient by userId, then filters FHIR resources by `patientId`.
  - API calls are scoped to the logged-in user (e.g., via row-level security in Supabase, or filtering by user ID on the backend)
    - Frontend: Every request includes `Authorization: Bearer ${token}` via `apiFetch()` wrapper (`src/lib/api.ts`). No request can be made without a valid Supabase session.
    - Backend: Auth middleware (`middleware/auth.ts`) verifies JWT signature using Supabase's public key, extracts `sub` claim as user ID, sets `req.user`. All route handlers pass `req.user!.id` to service methods. No Supabase admin client used in application routes.
  - No way to enumerate or access another user's resources by guessing IDs
    - Frontend: No user IDs appear in any URL paths. Resource detail fetches use resource IDs, but authorization is enforced server-side.
    - Backend: All detail endpoints validate ownership before returning data. Chat sessions check `session.userId !== userId` (throws 403). Timeline/medication/immunization detail endpoints check `resource.patientId !== patient.id` (returns 404, preventing information leakage). Integration tests explicitly verify cross-user access returns 404/403.
- [x] **Consent screen before retrieval** (explicit acknowledgment): what data is fetched, how it's used (insights/chat), delete controls, and (if applicable) external LLM data flow.
  - Three-step flow (Inform → Select → Confirm) in `src/pages/ConsentPage.tsx`, gated by `RequireConsent` route guard — user cannot reach data retrieval without completing consent.
  - **What data is fetched & how it's used:** Inform step explains records are fetched from connected provider networks to power the insights dashboard and AI-powered chat.
  - **Encryption specifics:** States data is stored in an encrypted database (AES-256 at rest, TLS in transit) — verified against Supabase infrastructure.
  - **Data retention:** Discloses records and chat history are stored until the user chooses to delete them; AI-sent excerpts are processed in real-time and not used to train AI models (per Anthropic API usage policy).
  - **External LLM data flow:** Dedicated `llmDataFlow` consent checkbox explains questions are de-identified (personal identifiers stripped) before processing, health record excerpts include clinical details (conditions, medications, dates) but not name, address, or other direct identifiers. Confirm step warns that excerpts sent to the AI provider are subject to the provider's data handling policies.
  - **Delete controls & consent revocation:** `deletionRights` checkbox covers both disabling AI chat in Settings (stops sending data to AI provider) and full permanent deletion of records, chat history, and account data.
  - **Backend enforcement:** Consent state stored via `POST /api/consent`; `RequireConsent` guard checks consent before allowing navigation to `/connect` or any data routes.
- [x] **Connect Sandbox Record** screen: pick a sandbox persona and link it to the signed-in user.
- [x] Trigger Metriport **Network Query** (async) to pull data and track the status in the UI for the user, store the data for later processing.
- [x] Example UI flow: Sign in → 2) Consent → 3) Select sandbox persona → 4) Retrieval progress screen → 5) Dashboard ready → 6) Timeline drilldown → 7) Deep Insight → 8) Chat with citations → 9) Delete my data

#### Core UX

Implement these screens:

- [x] **Home/Dashboard:** connected record, last updated, status (ready/running/partial/failed), and 3–6 summary cards (counts, active meds, etc.). CTAs to Timeline, Deep Dive, Chat.
- [x] **Timeline:** filter by category (encounters/conditions/meds/immunizations/labs), time range control, and an event details drawer/modal.
- [x] **Medications view:** grouped list + search/filter + details drawer.
- [x] **Immunizations view:** grouped list + details drawer.
- [x] **Settings:** Disconnect, **Delete my data**, and "AI mode" toggle.
- [x] **Citations UX requirement:** anywhere you show clinical facts, provide sources to back them up.

#### Insight features

Build an insight feature to help the user gain value from their data in some way.

Medication deep dive:

- [ ] computed insights (not just counts/sorting), e.g., likely duplicates, overlaps, changes over time
- [ ] a timeline/summary visualization of medication history
- [ ] a plain-language explanation of your heuristic + limitations
- [ ] drill-down that traces each insight back to underlying health data.

#### Secure health chat

- [ ] Chat UI that answers questions using RAG over the user's stored record
- [ ] Every answer must include citations to underlying resources.
- [ ] Must refuse medical advice ("should I…") and provide grounded facts only.
- [ ] Must address prompt injection: treat user input and record text as untrusted; document mitigations.

#### Tests (minimum)

- [ ] A few unit tests (e.g., parsing/enrichment logic)
- [ ] One integration or e2e "happy path" test (lightweight OK)

---

### STRETCH (only if time remains)

- [ ] More robust e2e coverage
- [ ] Medical Record Summary view
- [ ] Immunization and Lab Deep-Dive insight feature
- [ ] Mobile responsive

---

## Deliverables / Submission

Submit:

1. [ ] Github Repo link (or zip) with clean commits
2. [ ] README including:
   - [ ] setup instructions + `.env.example`
   - [ ] architecture diagram
   - [ ] data model summary
   - [ ] threat model + retention/deletion
   - [ ] product rationale: user problem, why the deep insight helps
   - [ ] "how this scales to millions in the US" (high level + compliance considerations)
   - [ ] tradeoffs + what you'd do next
   - [ ] AI Code set up - what AI tools are you using, and how are you using them to build
3. [ ] Tests runnable via documented commands
4. [ ] Max 15 minute video including a product demo, development process and architecture, and your thought process and decisions made.

---

## Acceptance Checklist

- [ ] Runs locally from README + `.env.example`
- [ ] Auth with user isolation
- [x] Consent screen before data retrieval
- [ ] Sandbox persona connect + async retrieval with status tracking
- [ ] FHIR data stored and used downstream
- [ ] Dashboard, Timeline, Medications, Immunizations, Settings — all with citations
- [ ] Deep Insight: computed insights + explanation + drill-down to source
- [ ] RAG chat with citations, advice refusal, and injection mitigations
- [ ] Delete my data works end-to-end
- [ ] Unit tests + 1 integration/e2e test
- [ ] README covers architecture, data model, threat model, rationale, scaling, tradeoffs, AI tooling
- [ ] ≤15 min walkthrough video (product demo, architecture, decisions)

---

## Evaluation Criteria

*Senior Full Stack Engineer — we're evaluating the ability to independently ship a production-quality product end-to-end.*

- **Product Thinking & UX** — Is the app intuitive and polished? Does it handle edge cases and failure states gracefully?
- **Architecture & Technical Depth** — Sound system design, data modeling, async pipeline, RAG implementation, and security at the architecture level.
- **Code Quality & Engineering** — Clean code, follows best practices, scalable with agentic development, meaningful tests, well-reasoned tooling choices.
- **Insight Quality** — Are computed insights genuinely useful (not trivial), clearly explained, and traceable to source data?
- **Communication & Senior Judgment** — Clear README narrative, tradeoffs, senior-level scaling thinking, and ability to scope and ship under a time constraint.

---

## Submission

Please submit the following by 5pm PST 2/27/2026:

- [ ] A GitHub repository or a `.zip` file with all materials
- [ ] Video walking through the product and your thought process. (Hit the points in the evaluation criteria)
- [ ] Share the repo / zip file with albright@coretsu.com

---

## BONUS TODO

- [ ] **Row-level security (RLS) for user isolation enhancement** — Currently user isolation is enforced entirely in application code (service-layer filtering by userId/patientId). Adding Supabase RLS policies would provide defense-in-depth so that even a bug in application code cannot expose another user's data.
