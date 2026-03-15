# PHRI Backend Integration Guide

This document is the complete reference for building the React/Vite frontend against the PHRI backend API. It covers every endpoint, exact request/response shapes, authentication flow, error handling, SSE streaming, and recommended frontend architecture.

**Backend base URL:** `https://phri-backend.vercel.app` — configured via `VITE_API_URL` env var.

---

## Table of Contents

1. [Authentication (Supabase)](#1-authentication-supabase)
2. [API Client Setup](#2-api-client-setup)
3. [Error Handling](#3-error-handling)
4. [User Flow & Route Guards](#4-user-flow--route-guards)
5. [Endpoints Reference](#5-endpoints-reference)
   - [Auth](#51-auth)
   - [Consent](#52-consent)
   - [Patient](#53-patient)
   - [Dashboard](#54-dashboard)
   - [Timeline](#55-timeline)
   - [Medications](#56-medications)
   - [Medication Insights](#57-medication-insights)
   - [Immunizations](#58-immunizations)
   - [Chat (SSE Streaming)](#59-chat-sse-streaming)
   - [Chat Sessions](#510-chat-sessions)
   - [Settings](#511-settings)
   - [Data Deletion](#512-data-deletion)
6. [SSE Streaming Implementation](#6-sse-streaming-implementation)
7. [Polling Pattern (Patient Status)](#7-polling-pattern-patient-status)
8. [Citation Rendering](#8-citation-rendering)
9. [Recommended Pages & Routes](#9-recommended-pages--routes)
10. [TypeScript Types](#10-typescript-types)
11. [Environment Variables](#11-environment-variables)

---

## 1. Authentication (Supabase)

The backend does NOT handle login/signup. Authentication is managed entirely by Supabase on the frontend.

### Setup

```bash
npm install @supabase/supabase-js
```

```typescript
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
```

### Login/Signup

Use Supabase's built-in auth methods. The backend accepts any valid Supabase JWT.

```typescript
// Email + password signup
await supabase.auth.signUp({ email, password });

// Email + password login
await supabase.auth.signInWithPassword({ email, password });

// OAuth (Google, GitHub, etc.)
await supabase.auth.signInWithOAuth({ provider: "google" });

// Logout
await supabase.auth.signOut();
```

### Getting the JWT

Every API call to the backend must include the Supabase access token in the `Authorization` header.

```typescript
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;
// Use: Authorization: Bearer <token>
```

The token refreshes automatically via Supabase's client SDK. Listen for auth state changes:

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  // Update stored token, redirect on SIGNED_OUT, etc.
});
```

---

## 2. API Client Setup

Create a centralized API client that automatically attaches the auth token and handles errors.

```typescript
// src/lib/api.ts
import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL; // "https://phri-backend.vercel.app"

async function getToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }
  return session.access_token;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new ApiError(res.status, body.error ?? "Unknown error");
  }

  // 204 No Content — no body to parse
  if (res.status === 204) return undefined as T;

  return res.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}
```

### Helper methods

```typescript
export const api = {
  get: <T>(path: string) => apiFetch<T>(path),

  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  delete: <T>(path: string) =>
    apiFetch<T>(path, { method: "DELETE" }),
};
```

---

## 3. Error Handling

All backend errors return this shape:

```json
{ "error": "Human-readable error message" }
```

### Status codes you will encounter

| Status | Meaning | When |
|---|---|---|
| `200` | OK | Successful GET/PATCH/POST |
| `201` | Created | Successful POST that creates a resource (consent, patient) |
| `204` | No Content | Successful disconnect or delete (no response body) |
| `400` | Bad Request | Validation failed (missing field, invalid format) |
| `401` | Unauthorized | Missing/expired/invalid JWT token |
| `403` | Forbidden | No consent, AI mode disabled, or accessing another user's data |
| `404` | Not Found | Resource doesn't exist (no patient, no session, etc.) |
| `409` | Conflict | Patient already connected, consent already recorded, or patient not ready |
| `429` | Too Many Requests | Rate limit exceeded (100/min general, 10/min chat) |
| `500` | Server Error | Unexpected backend error |

### Frontend error handling strategy

```typescript
try {
  const data = await api.get("/api/dashboard");
} catch (err) {
  if (err instanceof ApiError) {
    switch (err.status) {
      case 401:
        // Token expired — redirect to login
        await supabase.auth.signOut();
        navigate("/login");
        break;
      case 403:
        // No consent — redirect to consent screen
        navigate("/consent");
        break;
      case 404:
        // No patient — redirect to connect screen
        navigate("/connect");
        break;
      case 429:
        // Rate limited — show "try again later"
        toast.error("Too many requests. Please wait a moment.");
        break;
      default:
        toast.error(err.message);
    }
  }
}
```

---

## 4. User Flow & Route Guards

The app has a strict progression. The backend enforces this via middleware, but the frontend should also guard routes for good UX.

```
Login → Consent → Connect Persona → Retrieval Progress → Dashboard → [Timeline, Medications, Immunizations, Chat, Settings]
```

### Determining user state on app load

Call these endpoints in sequence on app startup to determine where to route the user:

```typescript
// 1. Check if logged in
const { data: { session } } = await supabase.auth.getSession();
if (!session) → redirect to /login

// 2. Check consent
const consent = await api.get("/api/consent");
if (consent === null) → redirect to /consent

// 3. Check patient
const patient = await api.get("/api/patient");
if (patient === null) → redirect to /connect

// 4. Check patient status
if (patient.status === "querying" || patient.status === "pending")
  → redirect to /progress (start polling)
if (patient.status === "failed")
  → show error state with retry option
if (patient.status === "ready" || patient.status === "partial")
  → redirect to /dashboard
```

### Route guard logic

| Route | Requires Auth | Requires Consent | Requires Patient Ready |
|---|---|---|---|
| `/login` | No | No | No |
| `/consent` | Yes | No | No |
| `/connect` | Yes | Yes | No |
| `/progress` | Yes | Yes | No |
| `/dashboard` | Yes | Yes | Yes |
| `/timeline` | Yes | Yes | Yes |
| `/medications` | Yes | Yes | Yes |
| `/immunizations` | Yes | Yes | Yes |
| `/chat` | Yes | Yes | Yes |
| `/settings` | Yes | Yes | No |
| `DELETE /settings/data` | Yes | **No** | No |

---

## 5. Endpoints Reference

### 5.1 Auth

#### `GET /api/auth/me`

Returns the authenticated user's info. Use this to verify the token is valid and get the user's email.

**Request:**
```
GET /api/auth/me
Authorization: Bearer <supabase-jwt>
```

**Response `200`:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com"
}
```

**Errors:** `401` if token is missing/invalid.

---

### 5.2 Consent

#### `GET /api/consent`

Check if the user has consented. Returns `null` if no consent exists.

**Request:**
```
GET /api/consent
Authorization: Bearer <token>
```

**Response `200`:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "consentedAt": "2026-02-25T10:30:00.000Z",
  "dataUsage": true,
  "llmDataFlow": true,
  "deletionRights": true
}
```

Or `null` if no consent has been recorded yet.

---

#### `POST /api/consent`

Record user consent. All three fields must be `true` — the backend rejects `false` values.

**Request:**
```
POST /api/consent
Authorization: Bearer <token>
Content-Type: application/json

{
  "dataUsage": true,
  "llmDataFlow": true,
  "deletionRights": true
}
```

**Response `201`:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "consentedAt": "2026-02-25T10:30:00.000Z",
  "dataUsage": true,
  "llmDataFlow": true,
  "deletionRights": true
}
```

**Errors:**
- `400` — a field is missing or `false`
- `409` — consent already recorded for this user

**Consent screen UI:**
The form must include exactly **3 checkboxes** — all must be checked before submission:
1. **`dataUsage`** — "I consent to my health records being fetched and stored for generating insights"
2. **`llmDataFlow`** — "I understand that my questions and health record excerpts are sent to an external AI (Claude) for chat"
3. **`deletionRights`** — "I understand I can delete all my data at any time"

The submit button should be disabled until all 3 are checked. Surround the checkboxes with explanatory text covering:
- What data is fetched (health records from connected networks)
- How it's used (insights dashboard, AI-powered chat)
- That data can be permanently deleted via Settings

---

### 5.3 Patient

#### `GET /api/patient`

Get the user's patient record. Returns `null` if no patient is connected.

**Request:**
```
GET /api/patient
Authorization: Bearer <token>
```

**Response `200`:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "metriportPatientId": "metriport-uuid",
  "sandboxPersona": "Jane",
  "facilityId": "facility-uuid",
  "status": "ready",
  "hasPartialData": false,
  "queryRequestId": "query-uuid",
  "lastSyncedAt": "2026-02-25T10:35:00.000Z",
  "createdAt": "2026-02-25T10:30:00.000Z"
}
```

Or `null` if no patient connected.

**Patient `status` values:**
| Status | Meaning | UI Action |
|---|---|---|
| `pending` | Patient created, query not started | Show spinner |
| `querying` | Network query in progress | Show progress screen, poll `/api/patient/status` |
| `partial` | Some data arrived, more expected | Can proceed to dashboard, show "partial" indicator |
| `ready` | All data received | Proceed to dashboard |
| `failed` | Query failed | Show error, offer retry |

---

#### `POST /api/patient/connect`

Connect a sandbox persona and start the data retrieval pipeline. This creates the patient in Metriport and triggers an async network query. Data arrives via webhooks over the next 15-30 seconds.

**Request:**
```
POST /api/patient/connect
Authorization: Bearer <token>
Content-Type: application/json

{
  "persona": "Jane"
}
```

**Valid personas:**

| Persona | Full Name | DOB | Gender | Notes |
|---|---|---|---|---|
| `"Jane"` | Jane Smith | 1996-02-10 | Female | ~30 yo, ~159 resources |
| `"Chris"` | Chris Smith | 1995-01-01 | Male | ~30 yo, ~159 resources |
| `"Ollie"` | Ollie Brown | 1946-03-18 | Male | ~80 yo, more encounter history |
| `"Kyla"` | Kyla Brown | 1927-05-23 | Female | ~99 yo, ~168 resources |
| `"Andreas"` | Andreas Brown | 1952-01-01 | Male | ~74 yo |

All personas yield 6 FHIR resource types: Condition, DiagnosticReport, Encounter, Immunization, Observation, Procedure. None have MedicationRequest resources in sandbox.

Display these as a card picker (name + age range + brief description). The persona name is stored as `sandboxPersona` on the patient record and appears in dashboard/settings responses

**Response `201`:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "metriportPatientId": "metriport-uuid",
  "sandboxPersona": "Jane",
  "facilityId": "facility-uuid",
  "status": "querying",
  "hasPartialData": false,
  "queryRequestId": "query-uuid",
  "lastSyncedAt": null,
  "createdAt": "2026-02-25T10:30:00.000Z"
}
```

**Errors:**
- `400` — invalid persona name
- `409` — patient already connected

**After this call:** immediately redirect to a progress screen and start polling `GET /api/patient/status`.

---

#### `GET /api/patient/status`

Lightweight endpoint for polling during data retrieval. Returns just the status field.

**Request:**
```
GET /api/patient/status
Authorization: Bearer <token>
```

**Response `200`:**
```json
{
  "status": "querying"
}
```

Or `null` if no patient exists.

---

### 5.4 Dashboard

#### `GET /api/dashboard`

Returns the dashboard summary: patient info, resource counts (summary cards), and the 5 most recent health events.

**Request:**
```
GET /api/dashboard
Authorization: Bearer <token>
```

**Response `200`:**
```json
{
  "patient": {
    "id": "uuid",
    "sandboxPersona": "Jane",
    "status": "ready",
    "lastSyncedAt": "2026-02-25T10:35:00.000Z"
  },
  "summary": {
    "totalResources": 159,
    "conditions": 12,
    "medications": 0,
    "activeMedications": 0,
    "observations": 45,
    "immunizations": 18,
    "encounters": 30,
    "allergies": 3,
    "procedures": 8,
    "diagnosticReports": 43
  },
  "recentActivity": [
    {
      "id": "uuid",
      "resourceType": "Condition",
      "displayText": "Type 2 Diabetes Mellitus",
      "dateRecorded": "2024-03-15T00:00:00.000Z",
      "source": "Hospital XYZ"
    }
  ]
}
```

**Errors:** `404` if no patient record exists.

**Summary cards to display:**
- Total Resources
- Conditions
- Medications (total + active subset)
- Observations
- Immunizations
- Encounters
- Allergies
- Procedures
- Diagnostic Reports / Labs

**Note:** Sandbox personas have 0 MedicationRequest resources. The medications count will be 0. This is expected — the medication endpoints and insights engine still work correctly (they return empty results).

**Dashboard CTAs (required by assessment):**
The dashboard must include prominent call-to-action buttons/links to:
- **Timeline** → `/timeline`
- **Deep Dive** (Medication Insights) → `/medications/insights`
- **Chat** → `/chat`

**Deep-linking from summary cards:**
Each summary count should link to a pre-filtered view. For example:
- Clicking "12 Conditions" → `/timeline?resourceType=Condition`
- Clicking "18 Immunizations" → `/immunizations`
- Clicking "45 Observations" → `/timeline?resourceType=Observation`
- Clicking "30 Encounters" → `/timeline?resourceType=Encounter`
- Clicking "8 Procedures" → `/timeline?resourceType=Procedure`
- Clicking "43 Diagnostic Reports" → `/timeline?resourceType=DiagnosticReport`

---

### 5.5 Timeline

#### `GET /api/timeline`

Paginated list of all health records with optional filtering by resource type and date range. Every item includes a citation.

**Request:**
```
GET /api/timeline?resourceType=Condition&dateFrom=2020-01-01T00:00:00.000Z&dateTo=2024-12-31T23:59:59.000Z&page=1&limit=20
Authorization: Bearer <token>
```

**Query parameters (all optional):**
| Param | Type | Default | Description |
|---|---|---|---|
| `resourceType` | string | — | Filter by FHIR type: `Condition`, `MedicationRequest`, `Observation`, `Immunization`, `Encounter`, `AllergyIntolerance`, `Procedure`, `DiagnosticReport` |
| `dateFrom` | ISO 8601 datetime | — | Start of date range (must include time: `2020-01-01T00:00:00.000Z`, NOT just `2020-01-01`) |
| `dateTo` | ISO 8601 datetime | — | End of date range (must include time: `2024-12-31T23:59:59.000Z`, NOT just `2024-12-31`) |
| `page` | integer >= 1 | `1` | Page number |
| `limit` | integer 1-100 | `20` | Items per page |

**Response `200`:**
```json
{
  "items": [
    {
      "id": "uuid",
      "resourceType": "Condition",
      "displayText": "Type 2 Diabetes Mellitus",
      "dateRecorded": "2024-03-15T00:00:00.000Z",
      "source": "Hospital XYZ",
      "citation": {
        "resourceType": "Condition",
        "resourceId": "original-fhir-id",
        "excerpt": "Type 2 Diabetes Mellitus",
        "date": "2024-03-15T00:00:00.000Z",
        "source": "Hospital XYZ"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 159,
    "totalPages": 8
  }
}
```

---

#### `GET /api/timeline/:id`

Full detail for a single resource, including the raw FHIR JSON data.

**Request:**
```
GET /api/timeline/some-uuid
Authorization: Bearer <token>
```

**Response `200`:**
```json
{
  "id": "uuid",
  "resourceType": "Condition",
  "resourceId": "original-fhir-id",
  "displayText": "Type 2 Diabetes Mellitus",
  "dateRecorded": "2024-03-15T00:00:00.000Z",
  "source": "Hospital XYZ",
  "data": {
    "resourceType": "Condition",
    "id": "original-fhir-id",
    "clinicalStatus": { "coding": [{ "code": "active" }] },
    "code": { "coding": [{ "display": "Type 2 Diabetes Mellitus" }] },
    "onsetDateTime": "2024-03-15"
  },
  "citation": {
    "resourceType": "Condition",
    "resourceId": "original-fhir-id",
    "excerpt": "Type 2 Diabetes Mellitus",
    "date": "2024-03-15T00:00:00.000Z",
    "source": "Hospital XYZ"
  }
}
```

The `data` field contains the full FHIR JSON. Use this for a detail drawer/modal. The structure varies by resource type.

**Rendering the `data` field:**
The FHIR JSON structure varies by resource type. For a detail drawer, show:
- **Primary display:** use the top-level `displayText`, `dateRecorded`, and `source` fields (already extracted)
- **Structured details:** extract key fields from `data` per resource type:
  - `Condition`: `data.clinicalStatus.coding[0].code`, `data.code.coding[0].display`
  - `Observation`: `data.valueQuantity.value` + `data.valueQuantity.unit`, `data.referenceRange`
  - `Encounter`: `data.class.code`, `data.period.start`/`data.period.end`
  - `Immunization`: `data.vaccineCode.coding[0].display`, `data.status`
  - `Procedure`: `data.code.coding[0].display`, `data.performedDateTime`
  - `DiagnosticReport`: `data.code.coding[0].display`, `data.conclusion`
- **Raw JSON fallback:** include a collapsible "View Raw FHIR" section with pretty-printed JSON for transparency

**Errors:** `404` if the resource doesn't exist or belongs to another user.

---

### 5.6 Medications

#### `GET /api/medications`

Returns medications grouped into `active` and `other` lists. Supports filtering by status and text search.

**Request:**
```
GET /api/medications?status=active&search=metformin
Authorization: Bearer <token>
```

**Query parameters (all optional):**
| Param | Type | Description |
|---|---|---|
| `status` | `"active"` \| `"stopped"` \| `"completed"` | Filter by medication status |
| `search` | string | Case-insensitive text search on medication name |

**Response `200`:**
```json
{
  "active": [
    {
      "id": "uuid",
      "name": "Metformin 500mg",
      "status": "active",
      "dosage": "Take 1 tablet by mouth daily",
      "dateRecorded": "2024-01-10T00:00:00.000Z",
      "source": "Primary Care",
      "citation": {
        "resourceType": "MedicationRequest",
        "resourceId": "original-fhir-id",
        "excerpt": "Metformin 500mg",
        "date": "2024-01-10T00:00:00.000Z",
        "source": "Primary Care"
      }
    }
  ],
  "other": [
    {
      "id": "uuid",
      "name": "Amoxicillin 250mg",
      "status": "stopped",
      "dosage": "Take 1 capsule three times daily",
      "dateRecorded": "2023-06-01T00:00:00.000Z",
      "source": "Urgent Care",
      "citation": { ... }
    }
  ]
}
```

**Note:** Sandbox personas have 0 medications. Both arrays will be empty. Display an appropriate empty state.

---

#### `GET /api/medications/:id`

Full detail for a single medication, including raw FHIR JSON.

**Request:**
```
GET /api/medications/some-uuid
Authorization: Bearer <token>
```

**Response `200`:**
```json
{
  "id": "uuid",
  "resourceType": "MedicationRequest",
  "resourceId": "original-fhir-id",
  "displayText": "Metformin 500mg",
  "dateRecorded": "2024-01-10T00:00:00.000Z",
  "source": "Primary Care",
  "data": { /* full FHIR MedicationRequest JSON */ },
  "citation": {
    "resourceType": "MedicationRequest",
    "resourceId": "original-fhir-id",
    "excerpt": "Metformin 500mg",
    "date": "2024-01-10T00:00:00.000Z",
    "source": "Primary Care"
  }
}
```

**Errors:** `404` if the resource doesn't exist, belongs to another user, or is not a MedicationRequest type.

---

### 5.7 Medication Insights

#### `GET /api/medications/insights`

Computed medication analysis: duplicate detection, dosage change tracking, and a methodology explanation. This is the "Deep Insight" feature.

**Request:**
```
GET /api/medications/insights
Authorization: Bearer <token>
```

**Response `200`:**
```json
{
  "insights": {
    "duplicates": [
      {
        "drug": "Metformin 500mg",
        "occurrences": [
          {
            "id": "uuid-1",
            "date": "2024-01-10T00:00:00.000Z",
            "source": "Primary Care",
            "dosage": "Take 1 tablet daily",
            "citation": {
              "resourceType": "MedicationRequest",
              "resourceId": "fhir-id-1",
              "excerpt": "Metformin 500mg",
              "date": "2024-01-10T00:00:00.000Z",
              "source": "Primary Care"
            }
          },
          {
            "id": "uuid-2",
            "date": "2024-03-01T00:00:00.000Z",
            "source": "Endocrinologist",
            "dosage": "Take 1 tablet daily",
            "citation": { ... }
          }
        ]
      }
    ],
    "changes": [
      {
        "drug": "Lisinopril",
        "history": [
          {
            "id": "uuid-3",
            "date": "2023-01-15T00:00:00.000Z",
            "dosage": "5mg once daily",
            "status": "stopped",
            "citation": { ... }
          },
          {
            "id": "uuid-4",
            "date": "2024-06-01T00:00:00.000Z",
            "dosage": "10mg once daily",
            "status": "active",
            "citation": { ... }
          }
        ]
      }
    ],
    "summary": {
      "totalUnique": 5,
      "totalActive": 3,
      "totalStopped": 2
    }
  },
  "methodology": {
    "description": "Medication insights are computed by analyzing MedicationRequest FHIR resources to identify duplicates, dosage changes, and summarize medication status.",
    "steps": [
      "Group medications by drug identity (RxNorm code or display text)",
      "Identify duplicates where the same drug appears in multiple records",
      "Detect dosage changes across records for the same drug",
      "Count active vs stopped medications"
    ],
    "limitations": [
      "Analysis is limited to MedicationRequest resources available in the patient record",
      "Drug matching relies on coded identifiers; different coding systems may not match",
      "Dosage comparison is text-based and may not detect semantically equivalent dosages"
    ]
  }
}
```

**Display guidance:**
- Show the `methodology.description` and `methodology.limitations` as a disclosure/accordion so users understand how insights are computed
- Each item in `duplicates` and `changes` has citations — render these as clickable links to source records
- `duplicates[].occurrences` — show as a grouped card: "Metformin 500mg appears in 2 records from different sources"
- `changes[].history` — show as a timeline: chronological view of dosage/status changes for the same drug
- `summary` — show as top-level stats (e.g., "5 unique medications, 3 active, 2 stopped")

**Note:** Sandbox returns empty insights (no MedicationRequest resources). Show an appropriate empty state.

---

### 5.8 Immunizations

#### `GET /api/immunizations`

List all immunizations with optional text search.

**Request:**
```
GET /api/immunizations?search=influenza
Authorization: Bearer <token>
```

**Query parameters:**
| Param | Type | Description |
|---|---|---|
| `search` | string (optional) | Case-insensitive text search on immunization name |

**Response `200`:**
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Influenza, seasonal, injectable",
      "status": "completed",
      "dateRecorded": "2024-10-15T00:00:00.000Z",
      "source": "Pharmacy",
      "citation": {
        "resourceType": "Immunization",
        "resourceId": "original-fhir-id",
        "excerpt": "Influenza, seasonal, injectable",
        "date": "2024-10-15T00:00:00.000Z",
        "source": "Pharmacy"
      }
    }
  ],
  "total": 18
}
```

---

#### `GET /api/immunizations/:id`

Full immunization detail including raw FHIR JSON.

**Request:**
```
GET /api/immunizations/some-uuid
Authorization: Bearer <token>
```

**Response `200`:**
```json
{
  "id": "uuid",
  "resourceType": "Immunization",
  "resourceId": "original-fhir-id",
  "displayText": "Influenza, seasonal, injectable",
  "dateRecorded": "2024-10-15T00:00:00.000Z",
  "source": "Pharmacy",
  "data": { /* full FHIR Immunization JSON */ },
  "citation": {
    "resourceType": "Immunization",
    "resourceId": "original-fhir-id",
    "excerpt": "Influenza, seasonal, injectable",
    "date": "2024-10-15T00:00:00.000Z",
    "source": "Pharmacy"
  }
}
```

**Errors:** `404` if the resource doesn't exist, belongs to another user, or is not an Immunization type.

---

### 5.9 Chat (SSE Streaming)

#### `POST /api/chat`

**This is NOT a normal JSON endpoint.** It returns a Server-Sent Events (SSE) stream. The response is `Content-Type: text/event-stream`.

**Request:**
```
POST /api/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "What conditions do I have?",
  "sessionId": "optional-existing-session-uuid"
}
```

**Request body:**
| Field | Type | Required | Description |
|---|---|---|---|
| `message` | string (1-2000 chars) | Yes | The user's question |
| `sessionId` | UUID string | No | Continue an existing chat session. Omit to start a new session |

**Response:** SSE stream (`Content-Type: text/event-stream`)

The stream emits `data:` lines, each containing a JSON object. Events arrive in this order:

**1. Text deltas** (many of these — stream as they arrive):
```
data: {"type":"text_delta","text":"Based on"}
data: {"type":"text_delta","text":" your records,"}
data: {"type":"text_delta","text":" you have the following"}
data: {"type":"text_delta","text":" conditions [1]:"}
```

**2. Citations** (one event, after all text):
```
data: {"type":"citations","citations":[{"index":1,"resourceType":"Condition","fhirResourceId":"uuid","excerpt":"Type 2 Diabetes Mellitus","date":"2024-03-15T00:00:00.000Z"},{"index":2,"resourceType":"Condition","fhirResourceId":"uuid","excerpt":"Hypertension","date":"2023-01-01T00:00:00.000Z"}]}
```

**3. Done** (final event):
```
data: {"type":"done","sessionId":"session-uuid","messageId":"message-uuid"}
```

**OR Error** (if something goes wrong):
```
data: {"type":"error","error":"Message contains disallowed content"}
```

**SSE Event Types:**

| Type | Shape | When |
|---|---|---|
| `text_delta` | `{ type: "text_delta", text: string }` | Streaming — concatenate `text` values to build the full response |
| `citations` | `{ type: "citations", citations: Citation[] }` | After all text — array of source references used in the response |
| `done` | `{ type: "done", sessionId: string, messageId: string }` | Stream complete — save `sessionId` for follow-up messages |
| `error` | `{ type: "error", error: string }` | Error occurred — display message, close stream |

**Citation object:**
```typescript
{
  index: number;        // Matches [N] in the response text
  resourceType: string; // "Condition", "Immunization", etc.
  fhirResourceId: string; // UUID — can be used to fetch detail via /api/timeline/:id
  excerpt: string;      // Short text from the source record
  date: string | null;  // Date of the source record
}
```

**Important behaviors:**
- The text will contain `[1]`, `[2]`, etc. markers. These correspond to `citations[].index`. Render them as clickable citation markers.
- **The `citations` event is only emitted when the response actually references sources.** If Claude's response contains no `[N]` markers, you will receive `text_delta` events followed directly by `done` (no `citations` event in between). Your frontend must handle this — don't wait for a citations event that may never come.
- `sessionId` from the `done` event should be stored and sent in subsequent messages to continue the conversation.
- If `sessionId` is omitted from the request, a new session is created.
- Rate limited to 10 requests/minute.
- Returns `403` if AI mode is disabled in settings.
- Returns `404` if no patient record exists.
- Returns `409` if patient status is not `ready` or `partial`.

**Prompt injection & safety responses:**
The backend detects prompt injection attempts (e.g., "ignore previous instructions", "pretend to be"). When detected, the stream returns:
```
data: {"type":"error","error":"Message contains disallowed content"}
```
Display this as a friendly message like **"I can only answer questions about your health records. Please rephrase your question."** — do NOT display the raw error string to the user.

The backend also instructs Claude to refuse medical advice ("should I take...", "is it safe to..."). Claude will respond with grounded facts and a disclaimer rather than advice. These come through as normal `text_delta` events — no special handling needed.

**Markdown in responses:**
Claude's responses contain markdown formatting — bold text, numbered lists, bullet points, headers, etc. Use a markdown renderer (e.g., `react-markdown`) to display assistant messages. Parse `[N]` citation markers before or after markdown rendering.

See [Section 6](#6-sse-streaming-implementation) for the complete frontend implementation.

---

### 5.10 Chat Sessions

#### `GET /api/chat/sessions`

List all chat sessions for the user (most recent first). Use this for a chat history sidebar.

**Request:**
```
GET /api/chat/sessions
Authorization: Bearer <token>
```

**Response `200`:**
```json
[
  {
    "id": "session-uuid",
    "createdAt": "2026-02-25T10:30:00.000Z",
    "preview": "What conditions do I have?"
  }
]
```

The `preview` field is the first 100 characters of the first message in the session (or `null` if empty).

---

#### `GET /api/chat/sessions/:id`

Get all messages for a specific session. Use this when the user clicks on a past session.

**Request:**
```
GET /api/chat/sessions/session-uuid
Authorization: Bearer <token>
```

**Response `200`:**
```json
[
  {
    "id": "message-uuid",
    "role": "user",
    "content": "What conditions do I have?",
    "citations": null,
    "createdAt": "2026-02-25T10:30:00.000Z"
  },
  {
    "id": "message-uuid",
    "role": "assistant",
    "content": "Based on your records, you have the following conditions [1][2]:\n\n1. Type 2 Diabetes...",
    "citations": [
      {
        "index": 1,
        "resourceType": "Condition",
        "fhirResourceId": "uuid",
        "excerpt": "Type 2 Diabetes Mellitus",
        "date": "2024-03-15T00:00:00.000Z"
      }
    ],
    "createdAt": "2026-02-25T10:30:05.000Z"
  }
]
```

**Errors:** `403` if the session belongs to another user. `404` if session doesn't exist.

---

### 5.11 Settings

#### `GET /api/settings`

Get user settings and connected persona information.

**Request:**
```
GET /api/settings
Authorization: Bearer <token>
```

**Response `200`:**
```json
{
  "aiModeEnabled": true,
  "connectedPersona": "Jane",
  "patientStatus": "ready",
  "lastSyncedAt": "2026-02-25T10:35:00.000Z"
}
```

If no patient is connected, `connectedPersona`, `patientStatus`, and `lastSyncedAt` will be `null`.
If no settings record exists, `aiModeEnabled` defaults to `true`.

---

#### `PATCH /api/settings`

Toggle AI mode on/off. When disabled, the chat endpoint returns `403`.

**Request:**
```
PATCH /api/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "aiModeEnabled": false
}
```

**Response `200`:**
```json
{
  "aiModeEnabled": false,
  "connectedPersona": "Jane",
  "patientStatus": "ready",
  "lastSyncedAt": "2026-02-25T10:35:00.000Z"
}
```

---

#### `POST /api/settings/disconnect`

Disconnect the patient record. Removes the patient from Metriport and deletes all FHIR resources and embeddings locally. Chat history and user account are preserved.

**Request:**
```
POST /api/settings/disconnect
Authorization: Bearer <token>
```

**Response:** `204 No Content`

**Errors:** `404` if no patient record exists (already disconnected or never connected).

After disconnect, the user can reconnect with a different (or the same) persona via `POST /api/patient/connect`.

---

### 5.12 Data Deletion

#### `DELETE /api/settings/data`

**Destructive.** Deletes the User row and ALL associated data via cascade: patient, FHIR resources, embeddings, chat sessions, chat messages, settings, and consent. The Supabase Auth account is NOT deleted (that's managed by Supabase).

**Request:**
```
DELETE /api/settings/data
Authorization: Bearer <token>
```

**Response:** `204 No Content`

**After this call:** the user's JWT is still valid (Supabase Auth is untouched), but all API calls will behave as if they're a new user. Redirect to the consent screen.

**Frontend must confirm before calling this.** Use a confirmation dialog: "This will permanently delete all your health records, chat history, and settings. This cannot be undone."

---

## 6. SSE Streaming Implementation

The chat endpoint uses Server-Sent Events. Here's the complete implementation:

```typescript
// src/lib/chat.ts
import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL;

export interface ChatCitation {
  index: number;
  resourceType: string;
  fhirResourceId: string;
  excerpt: string;
  date: string | null;
}

export type ChatSSEEvent =
  | { type: "text_delta"; text: string }
  | { type: "citations"; citations: ChatCitation[] }
  | { type: "done"; sessionId: string; messageId: string }
  | { type: "error"; error: string };

export async function streamChat(
  message: string,
  sessionId?: string,
  onEvent: (event: ChatSSEEvent) => void
): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");

  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ message, sessionId }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Process complete SSE lines
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? ""; // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const json = line.slice(6);
        try {
          const event: ChatSSEEvent = JSON.parse(json);
          onEvent(event);

          if (event.type === "done" || event.type === "error") {
            return;
          }
        } catch {
          // Skip malformed lines
        }
      }
    }
  }
}
```

### React hook usage

```typescript
// src/hooks/useChat.ts
import { useState, useCallback, useRef } from "react";
import { streamChat, ChatCitation, ChatSSEEvent } from "../lib/chat";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  citations?: ChatCitation[];
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const streamingTextRef = useRef("");

  const sendMessage = useCallback(async (text: string) => {
    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    // Add empty assistant message (will be filled by stream)
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    setIsStreaming(true);
    streamingTextRef.current = "";

    try {
      await streamChat(text, sessionId, (event: ChatSSEEvent) => {
        switch (event.type) {
          case "text_delta":
            streamingTextRef.current += event.text;
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: streamingTextRef.current,
              };
              return updated;
            });
            break;

          case "citations":
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                citations: event.citations,
              };
              return updated;
            });
            break;

          case "done":
            setSessionId(event.sessionId);
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                id: event.messageId,
              };
              return updated;
            });
            break;

          case "error":
            setMessages((prev) => {
              const updated = [...prev];
              // Show a friendly message for injection/safety errors
              const friendly = event.error === "Message contains disallowed content"
                ? "I can only answer questions about your health records. Please rephrase your question."
                : event.error;
              updated[updated.length - 1] = {
                role: "assistant",
                content: friendly,
              };
              return updated;
            });
            break;
        }
      });
    } catch (err) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: `Error: ${err instanceof Error ? err.message : "Something went wrong"}`,
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  }, [sessionId]);

  return { messages, isStreaming, sessionId, setSessionId, setMessages, sendMessage };
}
```

### Loading a previous chat session

When the user clicks on a session from the chat history sidebar, load its messages and set the sessionId so follow-up messages continue the same conversation:

```typescript
import { api } from "../lib/api";
import { ChatMessage } from "../types/api";

// In your chat page component:
async function loadSession(id: string) {
  const messages = await api.get<ChatMessage[]>(`/api/chat/sessions/${id}`);

  // Map to the hook's message format
  setMessages(
    messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      citations: m.citations ?? undefined,
    }))
  );

  // Set sessionId so the next sendMessage() continues this session
  setSessionId(id);
}
```

---

## 7. Polling Pattern (Patient Status)

After `POST /api/patient/connect`, poll for status updates:

```typescript
// src/hooks/usePatientStatus.ts
import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";

export function usePatientStatus() {
  const [status, setStatus] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const poll = async () => {
      try {
        const result = await api.get<{ status: string } | null>("/api/patient/status");
        if (!result) return;

        setStatus(result.status);

        // Stop polling when navigable or terminal state reached
        if (result.status === "ready" || result.status === "partial" || result.status === "failed") {
          clearInterval(intervalRef.current);
        }
      } catch {
        // Ignore polling errors
      }
    };

    // Poll every 3 seconds
    poll();
    intervalRef.current = setInterval(poll, 3000);

    return () => clearInterval(intervalRef.current);
  }, []);

  return status;
}
```

**Status transitions (typical):**
```
pending → querying → partial → ready     (happy path, ~15-30 seconds)
pending → querying → ready               (fast path, small dataset)
pending → querying → failed              (error path)
```

When `status === "partial"`, the user CAN proceed to the dashboard. Show a banner: "Some data is still loading. You may see incomplete results."

When `status === "ready"`, navigate to the dashboard.

When `status === "failed"`, show an error with option to disconnect and retry.

---

## 8. Citation Rendering

Every clinical data item from the API includes a `citation` object. The chat feature also returns citations.

### Data view citations (timeline, medications, immunizations)

```typescript
interface Citation {
  resourceType: string;   // "Condition", "MedicationRequest", etc.
  resourceId: string;     // Original FHIR resource ID
  excerpt: string | null; // Human-readable summary
  date: string | null;    // ISO datetime
  source: string | null;  // Source organization
}
```

Display as a small "Source" indicator on each card/row. On click, show a popover or navigate to the detail view (e.g., `/timeline/{id}`).

### Chat citations

**Important:** Chat citations use a DIFFERENT shape than data view citations. Key differences:
- Chat: `fhirResourceId` (DB UUID, usable with `/api/timeline/:id`) — no `source` field
- Data views: `resourceId` (original FHIR ID) — includes `source` field

If you want to show the source organization on a chat citation popover, fetch the resource detail via `GET /api/timeline/{fhirResourceId}`.

The assistant's response text contains `[1]`, `[2]`, etc. markers. The `citations` array maps index → source record.

**Rendering approach:**
1. Parse the response text for `[N]` patterns
2. Replace them with clickable superscript markers
3. On click, show a popover with the citation excerpt, date, and source
4. Optionally link to the full resource detail via `GET /api/timeline/{fhirResourceId}`

```typescript
// Example: parse citation markers in text
function renderTextWithCitations(text: string, citations: ChatCitation[]) {
  const parts = text.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/\[(\d+)\]/);
    if (match) {
      const index = parseInt(match[1], 10);
      const citation = citations.find((c) => c.index === index);
      if (citation) {
        return <CitationMarker key={i} citation={citation} />;
      }
    }
    return <span key={i}>{part}</span>;
  });
}
```

---

## 9. Recommended Pages & Routes

```typescript
// src/router.tsx
const routes = [
  { path: "/",              element: <RootRedirect /> },  // Determines user state, redirects appropriately
  { path: "/login",         element: <LoginPage /> },
  { path: "/consent",       element: <ConsentPage /> },
  { path: "/connect",       element: <ConnectPage /> },
  { path: "/progress",      element: <ProgressPage /> },
  { path: "/dashboard",     element: <DashboardPage /> },
  { path: "/timeline",      element: <TimelinePage /> },
  { path: "/medications",   element: <MedicationsPage /> },
  { path: "/medications/insights", element: <MedicationInsightsPage /> },
  { path: "/immunizations", element: <ImmunizationsPage /> },
  { path: "/chat",          element: <ChatPage /> },
  { path: "/settings",      element: <SettingsPage /> },
  { path: "*",              element: <Navigate to="/" /> },  // Catch-all
];
```

### Page → API mapping

| Page | Primary endpoint(s) | Notes |
|---|---|---|
| **Login** | (Supabase client only) | No backend calls |
| **Consent** | `GET /api/consent`, `POST /api/consent` | Check existing, then create |
| **Connect** | `POST /api/patient/connect` | Persona picker (5 options) |
| **Progress** | `GET /api/patient/status` (polling) | Poll every 3s, auto-redirect when ready |
| **Dashboard** | `GET /api/dashboard` | Summary cards + recent activity + CTAs |
| **Timeline** | `GET /api/timeline`, `GET /api/timeline/:id` | Filterable list + detail drawer |
| **Medications** | `GET /api/medications`, `GET /api/medications/:id` | Grouped list + detail drawer |
| **Medication Insights** | `GET /api/medications/insights` | Deep dive: duplicates + changes + methodology |
| **Immunizations** | `GET /api/immunizations`, `GET /api/immunizations/:id` | List + detail drawer |
| **Chat** | `POST /api/chat` (SSE), `GET /api/chat/sessions`, `GET /api/chat/sessions/:id` | Streaming chat + session history |
| **Settings** | `GET/PATCH /api/settings`, `POST /api/settings/disconnect`, `DELETE /api/settings/data` | Toggle AI mode, disconnect, delete |

---

## 10. TypeScript Types

Copy these into a shared types file in your frontend:

```typescript
// src/types/api.ts

// --- Auth ---
export interface User {
  id: string;
  email: string;
}

// --- Consent ---
export interface Consent {
  id: string;
  userId: string;
  consentedAt: string;
  dataUsage: boolean;
  llmDataFlow: boolean;
  deletionRights: boolean;
}

// --- Patient ---
export interface Patient {
  id: string;
  userId: string;
  metriportPatientId: string;
  sandboxPersona: string;
  facilityId: string;
  status: "pending" | "querying" | "partial" | "ready" | "failed";
  hasPartialData: boolean;
  queryRequestId: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
}

export type Persona = "Jane" | "Chris" | "Ollie" | "Kyla" | "Andreas";

export interface PatientStatus {
  status: "pending" | "querying" | "partial" | "ready" | "failed";
}

// --- Citation ---
export interface Citation {
  resourceType: string;
  resourceId: string;
  excerpt: string | null;
  date: string | null;
  source: string | null;
}

// --- Dashboard ---
export interface DashboardResponse {
  patient: {
    id: string;
    sandboxPersona: string;
    status: string;
    lastSyncedAt: string | null;
  };
  summary: {
    totalResources: number;
    conditions: number;
    medications: number;
    activeMedications: number;
    observations: number;
    immunizations: number;
    encounters: number;
    allergies: number;
    procedures: number;
    diagnosticReports: number;
  };
  recentActivity: Array<{
    id: string;
    resourceType: string;
    displayText: string | null;
    dateRecorded: string | null;
    source: string | null;
  }>;
}

// --- Timeline ---
export interface TimelineItem {
  id: string;
  resourceType: string;
  displayText: string | null;
  dateRecorded: string | null;
  source: string | null;
  citation: Citation;
}

export interface TimelineResponse {
  items: TimelineItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TimelineDetail {
  id: string;
  resourceType: string;
  resourceId: string;
  displayText: string | null;
  dateRecorded: string | null;
  source: string | null;
  data: unknown;
  citation: Citation;
}

// --- Medications ---
export interface MedicationItem {
  id: string;
  name: string | null;
  status: string | null;
  dosage: string | null;
  dateRecorded: string | null;
  source: string | null;
  citation: Citation;
}

export interface MedicationsResponse {
  active: MedicationItem[];
  other: MedicationItem[];
}

export interface MedicationDetail {
  id: string;
  resourceType: string;
  resourceId: string;
  displayText: string | null;
  dateRecorded: string | null;
  source: string | null;
  data: unknown;
  citation: Citation;
}

// --- Medication Insights ---
export interface DuplicateOccurrence {
  id: string;
  date: string | null;
  source: string | null;
  dosage: string | null;
  citation: Citation;
}

export interface DuplicateGroup {
  drug: string;
  occurrences: DuplicateOccurrence[];
}

export interface ChangeEntry {
  id: string;
  date: string | null;
  dosage: string | null;
  status: string | null;
  citation: Citation;
}

export interface ChangeGroup {
  drug: string;
  history: ChangeEntry[];
}

export interface MedicationInsightsResponse {
  insights: {
    duplicates: DuplicateGroup[];
    changes: ChangeGroup[];
    summary: {
      totalUnique: number;
      totalActive: number;
      totalStopped: number;
    };
  };
  methodology: {
    description: string;
    steps: string[];
    limitations: string[];
  };
}

// --- Immunizations ---
export interface ImmunizationItem {
  id: string;
  name: string | null;
  status: string | null;
  dateRecorded: string | null;
  source: string | null;
  citation: Citation;
}

export interface ImmunizationsResponse {
  items: ImmunizationItem[];
  total: number;
}

export interface ImmunizationDetail {
  id: string;
  resourceType: string;
  resourceId: string;
  displayText: string | null;
  dateRecorded: string | null;
  source: string | null;
  data: unknown;
  citation: Citation;
}

// --- Chat ---
export interface ChatCitation {
  index: number;
  resourceType: string;
  fhirResourceId: string;
  excerpt: string;
  date: string | null;
}

export type ChatSSEEvent =
  | { type: "text_delta"; text: string }
  | { type: "citations"; citations: ChatCitation[] }
  | { type: "done"; sessionId: string; messageId: string }
  | { type: "error"; error: string };

export interface ChatSession {
  id: string;
  createdAt: string;
  preview: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: ChatCitation[] | null;
  createdAt: string;
}

// --- Settings ---
export interface SettingsResponse {
  aiModeEnabled: boolean;
  connectedPersona: string | null;
  patientStatus: string | null;
  lastSyncedAt: string | null;
}
```

---

## 11. Environment Variables

Create a `.env` file in the frontend project root:

```bash
# Backend API
VITE_API_URL=https://phri-backend.vercel.app

# Supabase (public keys — safe to expose in frontend)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key
```

The Supabase URL and anon key are public (they're in the browser anyway). The backend API key is NOT needed — auth is handled by JWTs.

**CORS:** The backend validates the `Origin` header against its configured `CORS_ORIGIN` env var. The deployed backend at `phri-backend.vercel.app` is already configured to accept requests from the frontend's deployed URL. If you get `403 "Not allowed by CORS"` errors, it means the frontend origin doesn't match — this is a backend config issue, not a frontend bug.
