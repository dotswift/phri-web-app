# Epic MyChart Integration — Frontend Implementation Guide

> Everything a future agent needs to add Epic MyChart as a data source without breaking existing flows.

---

## Table of Contents

1. [Backend API Reference](#1-backend-api-reference)
2. [OAuth Flow](#2-oauth-flow)
3. [Multi-Source Coexistence](#3-multi-source-coexistence)
4. [New Files to Create](#4-new-files-to-create)
5. [Existing Files to Modify](#5-existing-files-to-modify)
6. [Patterns to Replicate](#6-patterns-to-replicate)
7. [Critical "Do Not Break" Rules](#7-critical-do-not-break-rules)
8. [Verification Steps](#8-verification-steps)

---

## 1. Backend API Reference

All Epic endpoints live under two route groups mounted in `src/app.ts`:

```
app.use("/epic",     epicRoutes);                     // OAuth (public callback + protected authorize)
app.use("/api/epic", requireAuth, epicApiRoutes);      // All other Epic API endpoints (JWT required)
```

### 1.1 `GET /epic/authorize` — Start OAuth

**Auth:** Bearer JWT (requireAuth middleware)

**Request:** No body or params. User ID is extracted from the JWT.

**Response `200`:**
```json
{
  "url": "https://fhir.epic.com/interconnect-fhir-oauth/oauth2/authorize?response_type=code&client_id=...&redirect_uri=...&scope=...&aud=...&state=...&code_challenge=...&code_challenge_method=S256"
}
```

**Frontend action:** Redirect the browser to `response.url` (full-page redirect, not a fetch).

---

### 1.2 `GET /epic/callback` — OAuth Callback (handled by backend)

**Auth:** None (public endpoint — Epic redirects here).

**Query params from Epic:**
| Param | Type | Description |
|-------|------|-------------|
| `code` | string | Authorization code |
| `state` | string | HMAC-signed state for CSRF verification |
| `error` | string? | Error code if auth failed |
| `error_description` | string? | Human-readable error |

**Behavior:**
1. Verifies HMAC state → extracts userId
2. Exchanges auth code for tokens (PKCE + optional Basic auth)
3. Encrypts and stores tokens in `EpicConnection` table
4. Creates/ensures `Patient` record with `status: "ready"`
5. Kicks off background sync (`syncAllResources`) — non-blocking
6. **Redirects browser** to:
   - Success: `{FRONTEND_URL}/epic/progress?status=success`
   - Error: `{FRONTEND_URL}/epic/progress?status=error&message={urlEncoded}`

**The frontend never calls this endpoint directly.** It only handles the redirect landing.

---

### 1.3 `GET /api/epic/status` — Connection & Sync Status

**Auth:** Bearer JWT

**Response `200`:**
```json
{
  "connected": true,
  "syncing": false,
  "patientFhirId": "eAB3mDIBBcyUKviyzY3Bw3gB.eCQMAwDVt3FMjhg0qcvSSeg3",
  "lastSyncAt": "2026-03-12T10:30:00.000Z",
  "tokenExpiresAt": "2026-03-12T11:30:00.000Z",
  "tokenExpired": false,
  "syncProgress": {
    "total": 19,
    "completed": 14,
    "errors": ["Coverage"]
  },
  "resourceCounts": {
    "Condition": 5,
    "Observation": 23,
    "Immunization": 8,
    "Encounter": 12,
    "Procedure": 3,
    "DiagnosticReport": 2,
    "AllergyIntolerance": 1,
    "MedicationRequest": 4,
    "DocumentReference": 6,
    "CarePlan": 1,
    "CareTeam": 1,
    "Goal": 2,
    "ServiceRequest": 3,
    "Device": 0,
    "Coverage": 0
  }
}
```

**When `syncing: true`:** `syncProgress` is present with live counters (poll this).
**When `syncing: false`:** `syncProgress` is undefined; `resourceCounts` has final totals.

**TypeScript type:**
```typescript
interface EpicStatus {
  connected: boolean;
  syncing: boolean;
  patientFhirId?: string;
  lastSyncAt: string | null;
  tokenExpiresAt?: string;
  tokenExpired?: boolean;
  syncProgress?: {
    total: number;
    completed: number;
    errors: string[];
  };
  resourceCounts?: Record<string, number>;
}
```

---

### 1.4 `POST /api/epic/sync` — Trigger Manual Re-Sync

**Auth:** Bearer JWT

**Request:** Empty body.

**Response `200`:** (returned immediately — sync runs in background)
```json
{
  "message": "Sync started"
}
```

**Frontend action:** After calling this endpoint, navigate to `/epic/progress` or poll `GET /api/epic/status` to track progress.

**Error responses:**
| Status | Body | Meaning |
|--------|------|---------|
| 404 | `{ "error": "No Epic connection — connect via /epic/authorize first" }` | No EpicConnection row |
| 409 | `{ "error": "Sync already in progress" }` | `syncing` is already true |

---

### 1.5 `POST /api/epic/disconnect` — Remove Epic Connection

**Auth:** Bearer JWT

**Request:** Empty body.

**Response:** `204 No Content`

**Side effects (in order):**
1. Deletes `ResourceEmbedding` rows where the linked `FhirResource.source = "epic"`
2. Deletes `FhirResource` rows where `source = "epic"`
3. Deletes `CachedInsight` rows for the patient
4. If no remaining FhirResources → sets `Patient.status = "pending"`
5. Deletes the `EpicConnection` row

---

### 1.6 `GET /api/epic/documents` — List DocumentReferences

**Auth:** Bearer JWT

**Response `200`:**
```json
[
  {
    "id": "uuid-of-fhir-resource-row",
    "resourceId": "epic-document-reference-id",
    "displayText": "Progress Note",
    "dateRecorded": "2024-08-15T00:00:00.000Z",
    "data": { /* full FHIR DocumentReference JSON */ }
  }
]
```

**Error:** `404` if no Patient record exists.

---

### 1.7 `GET /api/epic/documents/:id/content` — Fetch Document Binary

**Auth:** Bearer JWT

**URL param:** `id` — UUID of the FhirResource row (not the Epic resource ID).

**Response:** Raw binary with `Content-Type` header from Epic (e.g., `application/pdf`, `text/html`).

**Error responses:**
| Status | Meaning |
|--------|---------|
| 401 | Epic token expired — user must re-authorize |
| 403 | Forbidden by Epic |
| 404 | Document not found or no content URL |
| 502 | Epic FHIR server error |

---

### 1.8 `GET /api/settings` — Existing, Now Includes Epic Fields

The existing settings endpoint already returns Epic fields:

```json
{
  "aiModeEnabled": true,
  "connectedPersona": "Jane",
  "hasPatient": true,
  "patientStatus": "ready",
  "lastSyncedAt": "2026-03-10T...",
  "epicConnected": true,
  "epicPatientId": "eAB3mDIBBcyUKviyzY3Bw3gB...",
  "epicLastSyncAt": "2026-03-12T10:30:00.000Z",
  "epicTokenExpired": false
}
```

**Updated TypeScript type:**
```typescript
interface SettingsResponse {
  aiModeEnabled: boolean;
  connectedPersona: string | null;
  hasPatient: boolean;
  patientStatus: string | null;
  lastSyncedAt: string | null;
  epicConnected: boolean;
  epicPatientId: string | null;
  epicLastSyncAt: string | null;
  epicTokenExpired: boolean;
}
```

---

## 2. OAuth Flow

### Step-by-step browser redirect sequence

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Frontend  │     │ Backend  │     │   Epic   │     │ Frontend  │
│ (browser) │     │  server  │     │  MyChart │     │ (browser) │
└─────┬─────┘     └─────┬─────┘     └─────┬─────┘     └─────┬─────┘
      │                  │                  │                  │
  1.  │ GET /epic/authorize (JWT in header) │                  │
      │─────────────────►│                  │                  │
      │                  │                  │                  │
      │  { url: "https://fhir.epic.com/..." }                 │
      │◄─────────────────│                  │                  │
      │                  │                  │                  │
  2.  │ window.location.href = url          │                  │
      │─────────────────────────────────────►                  │
      │                  │                  │                  │
      │        (User logs in to MyChart,    │                  │
      │         approves data sharing)      │                  │
      │                  │                  │                  │
  3.  │                  │ GET /epic/callback?code=...&state=..│
      │                  │◄─────────────────│                  │
      │                  │                  │                  │
      │     (Backend exchanges code for tokens, stores them,   │
      │      starts background sync)        │                  │
      │                  │                  │                  │
  4.  │                  │  302 Redirect → /epic/progress?status=success
      │                  │─────────────────────────────────────►
      │                  │                  │                  │
  5.  │                  │                  │     Poll GET /api/epic/status
      │                  │                  │     until syncing=false
      │                  │                  │◄─ ─ ─ ─ ─ ─ ─ ─ │
```

### Frontend implementation

```typescript
// Step 1: Get the authorize URL
const { url } = await api.get<{ url: string }>("/epic/authorize");

// Step 2: Full-page redirect (NOT a fetch — leaves the SPA)
window.location.href = url;

// Steps 3-4 happen server-side; user lands back on /epic/progress

// Step 5: On EpicProgressPage mount, read query params and poll
const params = new URLSearchParams(window.location.search);
const status = params.get("status"); // "success" or "error"
const message = params.get("message"); // only on error
```

### Key details
- **PKCE (S256):** The backend generates a code verifier and challenge. The frontend does not need to handle PKCE.
- **State/CSRF:** The backend signs state with HMAC-SHA256. The frontend does not need to verify state.
- **Token storage:** Tokens are encrypted (AES-256-GCM) and stored server-side. The frontend never sees Epic tokens.
- **Scopes:** 27 scopes are requested (4 system + 23 FHIR R4 resource scopes).

---

## 3. Multi-Source Coexistence

### How sources share a Patient record

A single user has at most **one** `Patient` row. Data from all sources coexists:

| Source | `FhirResource.source` | How it's created |
|--------|----------------------|------------------|
| PDF upload | `null` or organization name from parsed content | `POST /api/upload/document` |
| Metriport sandbox | Organization name from FHIR `meta.source` | `POST /api/patient/connect` |
| Epic MyChart | `"epic"` | OAuth callback → `syncAllResources` |

### FhirResource deduplication

The `FhirResource` table has a unique constraint:

```
@@unique([patientId, resourceType, resourceId])
```

- Epic resources use Epic's FHIR IDs → no collision with Metriport or upload resources.
- If the same Epic resource is synced twice, it upserts (updates `data`, `displayText`, `dateRecorded`).

### Dashboard, timeline, and insights merge all sources

- `GET /api/dashboard` aggregates **all** `FhirResource` rows for the patient regardless of source.
- `recentActivity` includes all sources, each with a `source` field for display.
- Medication and immunization insights analyze all resources together.
- Embeddings are generated per-resource (any source) and chat searches across all of them.

### Patient status interaction

| Scenario | Patient.status |
|----------|---------------|
| Epic connected (no prior Patient) | `"ready"` (storeTokens creates Patient with status "ready") |
| Epic connected (Patient already exists) | **Unchanged** (storeTokens does NOT modify existing Patient status) |
| Only upload | Follows upload flow → `"ready"` on complete |
| Only Metriport | `"querying"` → `"downloading"` → `"processing"` → `"ready"` |
| Epic + upload | `"ready"` (whichever source set it first) |
| Epic disconnected, upload remains | Stays `"ready"` (resources still exist) |
| Epic disconnected, nothing remains | `"pending"` (reset by disconnect) |

### Embedding generation

- Epic sync automatically triggers `embedFhirResources()` after sync completes.
- Upload triggers embedding after the `/embed` post-processing call.
- Rebuild (`POST /api/settings/regenerate-insights`) re-embeds everything.
- Chat and insights work identically regardless of source.

---

## 4. New Files to Create

### 4.1 `src/pages/EpicProgressPage.tsx`

**Purpose:** Landing page after Epic OAuth callback. Shows sync progress with a stepper UI.

**Component structure:**
```typescript
// src/pages/EpicProgressPage.tsx
import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useHealthData } from "@/context/HealthDataContext";
import { useEpicStatus } from "@/hooks/useEpicStatus";

// Steps to display (adapt from ProgressPage pattern):
const STEPS = [
  { label: "Connected to Epic MyChart", icon: ShieldCheck },
  { label: "Downloading your health records", icon: Download },
  { label: "Processing & generating insights", icon: BrainCircuit },
  { label: "Your records are ready", icon: CircleCheckBig },
];

export default function EpicProgressPage() {
  const [searchParams] = useSearchParams();
  const callbackStatus = searchParams.get("status"); // "success" | "error"
  const errorMessage = searchParams.get("message");
  const navigate = useNavigate();
  const { refreshUserState } = useAuth();
  const { refresh: refreshHealthData } = useHealthData();
  const epicStatus = useEpicStatus();

  // On mount: if status=success, refresh auth state then start polling
  // Map epicStatus.syncProgress to step index:
  //   Step 0: callback success (connected)
  //   Step 1: syncing=true (downloading)
  //   Step 2: syncing just finished (processing insights — embeddings running)
  //   Step 3: fully complete → navigate to /home after delay

  // On error: show error message with "Try Again" button → /settings or /records-choice

  // Reuse ProgressPage's stepper circle + connector animation pattern
  // Reuse MIN_STEP_MS (2s minimum per step) for smooth UX
}
```

**Key behaviors:**
- Read `?status=success` or `?status=error&message=...` from URL on mount
- On success: call `refreshUserState()` to pick up the new Patient, then poll
- Poll `GET /api/epic/status` every 3 seconds while `syncing: true`
- Show `syncProgress.completed / syncProgress.total` as a sub-label (e.g., "14 of 19 categories")
- When `syncing: false` and `resourceCounts` present → step 3 → auto-navigate to `/home`
- On error or `?status=error`: show error card with message and retry/back buttons

---

### 4.2 `src/hooks/useEpicStatus.ts`

**Purpose:** Poll `GET /api/epic/status` at an interval, similar to `usePatientStatus`.

```typescript
// src/hooks/useEpicStatus.ts
import { useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";

interface EpicStatus {
  connected: boolean;
  syncing: boolean;
  patientFhirId?: string;
  lastSyncAt: string | null;
  tokenExpiresAt?: string;
  tokenExpired?: boolean;
  syncProgress?: {
    total: number;
    completed: number;
    errors: string[];
  };
  resourceCounts?: Record<string, number>;
}

export function useEpicStatus(pollMs = 3000) {
  const [status, setStatus] = useState<EpicStatus | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const data = await api.get<EpicStatus>("/api/epic/status");
        if (!cancelled) setStatus(data);
        // Stop polling when no longer syncing
        if (data.connected && !data.syncing && intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      } catch {
        // Silently retry on network error
      }
    };

    poll(); // Immediate first fetch
    intervalRef.current = setInterval(poll, pollMs);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pollMs]);

  return status;
}
```

---

### 4.3 Type additions — `src/types/api.ts`

Add these types to the existing file:

```typescript
// Epic connection status (from GET /api/epic/status)
interface EpicStatus {
  connected: boolean;
  syncing: boolean;
  patientFhirId?: string;
  lastSyncAt: string | null;
  tokenExpiresAt?: string;
  tokenExpired?: boolean;
  syncProgress?: {
    total: number;
    completed: number;
    errors: string[];
  };
  resourceCounts?: Record<string, number>;
}

// Update existing SettingsResponse to include Epic fields
interface SettingsResponse {
  aiModeEnabled: boolean;
  connectedPersona: string | null;
  hasPatient: boolean;
  patientStatus: string | null;
  lastSyncedAt: string | null;
  // New Epic fields:
  epicConnected: boolean;
  epicPatientId: string | null;
  epicLastSyncAt: string | null;
  epicTokenExpired: boolean;
}
```

---

## 5. Existing Files to Modify

### 5.1 `src/pages/RecordsChoicePage.tsx`

**Current state:** Two cards — "I have my records" and "Help me get them".

**Change:** Add a third card for Epic MyChart.

```tsx
// Add third option card:
{
  title: "Connect Epic MyChart",
  description: "Import records directly from your healthcare provider",
  icon: Hospital, // or a custom Epic icon
  onClick: handleEpicConnect,
}

// Handler:
async function handleEpicConnect() {
  try {
    const { url } = await api.get<{ url: string }>("/epic/authorize");
    window.location.href = url; // Full-page redirect to Epic
  } catch (err) {
    toast.error("Failed to start Epic connection");
  }
}
```

**Important:** The `GET /epic/authorize` call requires auth. The existing `api.get()` helper in `src/lib/api.ts` automatically attaches the Bearer token, so this works out of the box.

---

### 5.2 `src/pages/SettingsPage.tsx`

**Add an "Epic MyChart" section** that shows connection state and actions.

**Placement:** After the "Upload Records" section, before "Export Records".

```tsx
// Fetch settings (already done in SettingsPage):
const settings = /* GET /api/settings */;

// New section: Epic MyChart
{settings.epicConnected ? (
  <Card>
    <CardHeader>
      <CardTitle>Epic MyChart</CardTitle>
      <CardDescription>Connected • Patient ID: {settings.epicPatientId}</CardDescription>
    </CardHeader>
    <CardContent>
      <p>Last synced: {formatDate(settings.epicLastSyncAt)}</p>
      {settings.epicTokenExpired && (
        <Alert variant="warning">
          Your Epic session has expired.
          <Button onClick={handleReauthorize}>Reconnect</Button>
        </Alert>
      )}
      <div className="flex gap-2 mt-4">
        <Button variant="outline" onClick={handleResync}>Re-sync Records</Button>
        <Button variant="destructive" onClick={handleDisconnectEpic}>Disconnect</Button>
      </div>
    </CardContent>
  </Card>
) : (
  <Card>
    <CardHeader>
      <CardTitle>Epic MyChart</CardTitle>
      <CardDescription>Import records from your healthcare provider</CardDescription>
    </CardHeader>
    <CardContent>
      <Button onClick={handleEpicConnect}>Connect Epic</Button>
    </CardContent>
  </Card>
)}
```

**Handlers:**
```typescript
async function handleEpicConnect() {
  const { url } = await api.get<{ url: string }>("/epic/authorize");
  window.location.href = url;
}

async function handleResync() {
  await api.post("/api/epic/sync"); // Returns immediately — sync runs in background
  toast.success("Sync started");
  navigate("/epic/progress"); // Poll status on progress page
}

async function handleDisconnectEpic() {
  // Show confirmation dialog first
  await api.post("/api/epic/disconnect");
  refreshUserState();
  refreshHealthData();
  toast.success("Epic disconnected");
}

async function handleReauthorize() {
  // Same as connect — Epic will recognize the user and skip consent if session is still valid
  const { url } = await api.get<{ url: string }>("/epic/authorize");
  window.location.href = url;
}
```

---

### 5.3 `src/router.tsx`

**Add route for EpicProgressPage:**

```tsx
// Inside the auth-required, consent-given section (alongside /upload/progress, /progress):
{
  path: "epic/progress",
  lazy: () => import("./pages/EpicProgressPage"),
}
```

**No route guard needed beyond RequireAuth + RequireConsent.** The page itself handles error states from query params.

---

### 5.4 `src/types/api.ts`

Add `EpicStatus` interface and update `SettingsResponse` as shown in section 4.3.

---

### 5.5 `vite.config.ts`

**Add proxy rule for `/epic` (non-API OAuth routes):**

```typescript
server: {
  proxy: {
    "/api": {
      target: apiUrl,
      changeOrigin: true,
    },
    // Add this — the /epic/authorize endpoint is not under /api
    "/epic": {
      target: apiUrl,
      changeOrigin: true,
    },
  },
},
```

**Why:** The OAuth flow uses `GET /epic/authorize` which is not under `/api`. Without this proxy, dev mode will serve the SPA's index.html for `/epic/authorize` instead of proxying to the backend.

**Note:** `/epic/callback` is called by Epic's servers directly to the backend URL (configured in `EPIC_REDIRECT_URI`), not through the frontend dev server. The proxy is only needed for `/epic/authorize`.

---

## 6. Patterns to Replicate

### 6.1 ProgressPage stepper (`src/pages/ProgressPage.tsx`)

The existing ProgressPage uses a vertical stepper with:
- Step circles that animate from gray → blue → green
- Connector lines between steps with fill animation
- `MIN_STEP_MS = 2000` — minimum time per step for smooth transitions
- `statusToStep()` mapping function
- Auto-navigation to `/home` after 1.5s in final state
- `prefers-reduced-motion` respect

**Replicate this for EpicProgressPage** but map Epic sync states:
| Epic state | Step |
|------------|------|
| Callback success, `syncing: true`, `completed = 0` | 0 (Connected) |
| `syncing: true`, `completed > 0` | 1 (Downloading) |
| `syncing: false`, resourceCounts present | 2 (Processing) |
| After brief delay | 3 (Ready) → navigate to /home |

---

### 6.2 RebuildContext (`src/context/RebuildContext.tsx`)

Pattern: localStorage flag + stale timeout (5 min) + API call + refresh.

**No new context needed for Epic**, but the EpicProgressPage should call `refreshHealthData()` after sync completes so dashboard/insights reflect the new data.

---

### 6.3 usePatientStatus polling (`src/hooks/usePatientStatus.ts`)

Pattern:
- `useState` for status
- `setInterval` with ref for cleanup
- Stop polling on terminal states
- Immediate first fetch

**Replicate as `useEpicStatus`** (section 4.2) with the same pattern but polling `/api/epic/status` and stopping when `syncing: false`.

---

### 6.4 Settings card states (`src/pages/SettingsPage.tsx`)

Pattern: Conditional rendering based on `hasPatient`, `patientStatus`, settings values.

**Replicate for Epic section** using `settings.epicConnected`, `settings.epicTokenExpired`.

---

### 6.5 API client (`src/lib/api.ts`)

All backend calls go through `api.get()`, `api.post()`, etc. These automatically:
- Attach the Supabase Bearer token
- Parse JSON responses
- Throw `ApiError` on non-2xx

**Use the same `api` object for all Epic endpoints.** The one exception is `/epic/authorize` — it returns a URL for redirect, not a page fetch.

---

### 6.6 Toast notifications (`sonner`)

Pattern: `toast.success("message")`, `toast.error("message")` for user feedback.

Use for: sync started, disconnect complete, errors.

---

## 7. Critical "Do Not Break" Rules

### 7.1 Patient status flow

The router uses `RequirePatient` to gate access to main app routes. It checks:
```
patient.status === "ready" || patient.status === "partial"
```

**Rule:** Epic's token store sets `Patient.status = "ready"` immediately. Do NOT change this — it allows the user to access the app while sync runs in the background. The `useEpicStatus` hook on the progress page is separate from `usePatientStatus`.

### 7.2 Rebuild/delete cascade

`POST /api/settings/regenerate-insights` and `DELETE /api/settings/data` operate on ALL sources. They delete all `CachedInsight`, `ResourceEmbedding`, and (for delete) `FhirResource` rows regardless of source.

**Rule:** Do NOT add source-specific regenerate or delete-all. Use `POST /api/epic/disconnect` for Epic-only cleanup. The existing wipe (`DELETE /api/settings/data`) already handles Epic data via cascade.

### 7.3 Embedding generation timing

Embeddings are generated:
1. After Epic sync completes (triggered by backend automatically)
2. After upload post-processing (`/embed` endpoint)
3. On manual rebuild

**Rule:** Do NOT trigger embedding generation from the frontend. The backend handles it. The frontend should only call rebuild via `POST /api/settings/regenerate-insights` if the user explicitly requests it.

### 7.4 AuthContext.refreshUserState()

This fetches `GET /api/patient` and updates `auth.patient`. After Epic OAuth callback, the Patient may be newly created.

**Rule:** Always call `refreshUserState()` on EpicProgressPage mount (after successful callback) so the router picks up the new Patient and doesn't redirect to onboarding.

### 7.5 HealthDataContext fetch guards

`HealthDataContext` only fetches dashboard/insights when `patientStatus === "ready" | "partial" | "processing" | "pending"`. It checks `auth.patient` — if patient is null, it skips.

**Rule:** After calling `refreshUserState()`, the health data context will automatically refetch. Do NOT manually call dashboard endpoints — let the context handle it via `refreshHealthData()`.

### 7.6 Existing data source flows must still work

- PDF upload flow (`/upload` → `/upload/progress`) must be unchanged
- Metriport sandbox flow (`/connect` → `/progress`) must be unchanged
- Settings page upload dialog must still work
- Chat, export, records views are source-agnostic and require no changes

### 7.7 Do not modify the `/api` proxy

The Vite proxy for `/api` must remain unchanged. Only ADD the `/epic` proxy alongside it.

### 7.8 Token expiry UX

When `settings.epicTokenExpired === true`, the user must re-authorize (same OAuth flow). Display a warning on the Settings page with a "Reconnect" button. Do NOT silently attempt re-auth — Epic requires user interaction.

---

## 8. Verification Steps

### Functional verification

- [ ] `GET /epic/authorize` returns a valid URL when called with auth token
- [ ] Browser redirects to Epic login page
- [ ] After Epic login, browser lands on `/epic/progress?status=success`
- [ ] EpicProgressPage shows stepper, polls `/api/epic/status`
- [ ] Progress updates as sync runs (completed count increases)
- [ ] After sync completes, user auto-navigates to `/home`
- [ ] Dashboard shows Epic-sourced resources
- [ ] Settings page shows Epic connected state with last sync time
- [ ] "Re-sync Records" triggers new sync
- [ ] "Disconnect" removes Epic data, dashboard updates
- [ ] If no other data sources remain after disconnect, user is redirected to onboarding

### Multi-source verification

- [ ] Upload a PDF first, then connect Epic — both sources appear in dashboard
- [ ] Disconnect Epic — PDF resources remain, dashboard still works
- [ ] Connect Metriport persona, then connect Epic — both sources appear
- [ ] "Delete All Data" removes everything including Epic connection
- [ ] Rebuild regenerates insights from all sources

### Error handling verification

- [ ] `/epic/progress?status=error&message=...` shows error with message
- [ ] Network failure during polling shows retry or error state
- [ ] Expired token shows warning on Settings page
- [ ] Re-authorize flow works after token expiry

### Routing verification

- [ ] `/epic/progress` is accessible only when authenticated with consent
- [ ] Direct navigation to `/epic/progress` without query params shows appropriate state
- [ ] All existing routes still work unchanged
- [ ] `RootRedirect` still works correctly (patient ready → /home, no patient → onboarding)

### Dev environment verification

- [ ] Vite proxy forwards `/epic/authorize` to backend
- [ ] Vite proxy forwards `/api/epic/*` to backend
- [ ] No CORS issues in dev mode

---

## Appendix: File Reference

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/EpicProgressPage.tsx` | **CREATE** | Post-OAuth landing page with sync progress stepper |
| `src/hooks/useEpicStatus.ts` | **CREATE** | Poll `GET /api/epic/status` with interval |
| `src/pages/RecordsChoicePage.tsx` | **MODIFY** | Add "Connect Epic MyChart" third card |
| `src/pages/SettingsPage.tsx` | **MODIFY** | Add Epic connection section with status/actions |
| `src/router.tsx` | **MODIFY** | Add `epic/progress` route |
| `src/types/api.ts` | **MODIFY** | Add `EpicStatus` type, update `SettingsResponse` |
| `vite.config.ts` | **MODIFY** | Add `/epic` dev proxy rule |
