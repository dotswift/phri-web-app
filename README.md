# PHRI — Personal Health Record & Insights (Frontend)

A React/Vite frontend for the PHRI platform — a consent-first personal health record viewer with AI-powered chat, medication insights, and citation-grounded trust.

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ (includes npm)
- [Git](https://git-scm.com/)
- A running PHRI backend (see [backend repo](https://github.com/your-org/phri-backend))

### Install & Run

```bash
git clone https://github.com/your-org/phri-web-app.git
cd phri-web-app
npm install
cp .env.example .env   # then fill in the values below
npm run dev             # opens http://localhost:5173
```

### Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API URL (e.g. `https://phri-backend.vercel.app`) |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key — only needed for E2E tests, never exposed in the frontend |

### Commands

```bash
npm run dev          # Dev server (Vite) — http://localhost:5173
npm run build        # Type-check + production build
npm run preview      # Preview the production build locally
npm run test         # Run unit tests (Vitest)
npm run test:watch   # Unit tests in watch mode
npm run test:e2e     # E2E tests (Playwright, headed)
npm run test:e2e:ci  # E2E tests (Playwright, headless)
npm run lint         # ESLint
```

---

## Architecture

```
Browser (React SPA)
   │
   ├── Supabase Auth (JWT)
   │
   └── PHRI Backend API ──┬── PostgreSQL (Prisma + pgvector)
                          ├── Metriport Medical API (FHIR)
                          ├── Claude (AI chat)
                          └── Voyage (embeddings)
```

### Frontend Stack
- **React 19** + **Vite** + **TypeScript** — fast dev, type-safe
- **React Router v7** — client-side routing with guard components
- **Tailwind CSS v4** + **shadcn/ui** — Radix-based accessible components
- **Supabase JS** — auth (JWT management, session persistence)
- **react-markdown** — render AI chat responses with formatting
- **Vitest** + **React Testing Library** — unit + integration tests

### Project Structure

```
src/
├── components/
│   ├── layout/       # AppLayout (sidebar nav + outlet)
│   ├── shared/       # CitationBadge, DetailDrawer, ChatMessage, ConfirmDialog, etc.
│   └── ui/           # shadcn/ui auto-generated components
├── context/          # AuthContext (user, consent, patient state)
├── hooks/            # useAuth, useChat, usePatientStatus
├── lib/              # supabase.ts, api.ts (fetch wrapper), chat.ts (SSE)
├── pages/            # All page components (11 pages)
├── types/            # TypeScript interfaces matching backend API
├── router.tsx        # Routes with guard wrappers
├── App.tsx           # Root component
└── main.tsx          # Entry point
```

---

## Data Model

The frontend is stateless — all data comes from the backend API. No PHI is stored in localStorage or client state beyond the current session.

Key entities (all server-side, Prisma-managed):
- **User** — Supabase auth ID mapping
- **Consent** — 3-flag consent record
- **Patient** — linked Metriport persona + status
- **FhirResource** — normalized health records (Condition, Observation, etc.)
- **Embedding** — pgvector embeddings for RAG chat
- **ChatSession / ChatMessage** — conversation history with citations

---

## Threat Model

| Concern | Mitigation |
|---|---|
| **Authentication** | Supabase JWT — tokens auto-refresh, validated server-side |
| **PHI in browser** | No PHI in localStorage. Data only in React state during active session |
| **CORS** | Backend validates `Origin` header against allowlist |
| **Prompt injection** | Server-side detection returns safe error; frontend rewrites to friendly message |
| **XSS** | React auto-escapes. Markdown rendered via react-markdown (no dangerouslySetInnerHTML) |
| **Rate limiting** | Backend enforces 100/min general, 10/min chat — frontend shows friendly error |
| **Data deletion** | Destructive confirm dialog requires typing "DELETE". Server cascades all data |

---

## Product Rationale

### Consent-First Flow
Users must explicitly consent to data usage, AI data flow, and acknowledge deletion rights before any health data is fetched. This builds trust and meets privacy expectations.

### Citation-Grounded Trust
Every piece of data — timeline items, medication records, chat responses — includes traceable citations back to the original FHIR resource. Users can always verify the source.

### Cross-Provider Medication Insights
The Deep Dive feature detects duplicate prescriptions across providers and tracks dosage changes over time — insights that are impossible when records are siloed.

### AI Chat with Guardrails
Chat uses RAG with the patient's actual health records. Prompt injection is detected server-side. Medical advice requests get factual responses with disclaimers rather than recommendations.

---

## Scaling Considerations

| Aspect | Current | At Scale |
|---|---|---|
| **Static assets** | Vite dev server | CDN (Vercel/CloudFront) |
| **Bundle size** | ~765KB (gzip: ~228KB) | Code splitting via dynamic imports |
| **Data loading** | Full page fetch | Pagination (timeline), debounced search |
| **State management** | React Context + local state | React Query for cache/dedup |
| **Backend** | Vercel serverless | Same (auto-scales) |

---

## Tradeoffs & What I'd Do Next

### Tradeoffs Made
- **React Context over Redux/Zustand** — sufficient for this scope, avoids dependency
- **No React Query** — direct fetch + useState keeps it simple; would add for production caching
- **shadcn/ui** — copy-paste components give full control vs. importing a component library
- **Client-side grouping** (immunizations by year) — OK for small datasets; would move server-side for large ones

### What I'd Add Next
1. **React Query** — automatic caching, background refetch, optimistic updates
2. **Code splitting** — lazy-load page components for smaller initial bundle
3. **Offline support** — service worker for static assets, queued mutations
4. **Accessibility audit** — keyboard navigation, screen reader testing, ARIA improvements
5. **E2E tests** — Playwright tests for the full user flow
6. **Dark mode toggle** — CSS variables are already set up for it
7. **Real-time updates** — WebSocket or polling for live data sync notifications

---

## AI Tooling

This frontend was built with [Claude Code](https://claude.com/claude-code) (Claude Opus 4.6). Claude Code was used for:
- Project scaffolding and dependency setup
- Component implementation from the integration guide spec
- Test writing and debugging
- Build error resolution
