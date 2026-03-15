# Medical Record Export — Frontend Integration Guide

## Overview

The export feature lets authenticated users download their health data in multiple formats:

- **PDF Report** — human-readable health summary with tables
- **CSV Spreadsheet** — tabular data (one CSV per resource type, zipped if multiple)
- **FHIR Bundle** — standards-compliant FHIR R4 JSON Bundle
- **Full Archive** — ZIP containing PDF + CSVs + FHIR JSON + document manifest

### Backend source files

| File | Purpose |
|------|---------|
| `src/routes/export.routes.ts` | Route definitions, validation, response handling |
| `src/services/export.service.ts` | Data loading, format-specific export logic |
| `src/utils/pdf-report.ts` | PDFKit-based health summary generator |
| `src/utils/csv-formatter.ts` | CSV column definitions and row mapping |

---

## API Reference

Base path: `/api/export`

### GET `/api/export/formats`

Returns the list of available export formats.

**Auth:** Bearer token required (no consent check).

**Response** `200 OK`:

```json
{
  "formats": [
    {
      "id": "pdf",
      "name": "PDF Report",
      "description": "Human-readable health summary report",
      "fileType": "application/pdf"
    },
    {
      "id": "csv",
      "name": "CSV Spreadsheet",
      "description": "Tabular data for spreadsheet applications",
      "fileType": "text/csv"
    },
    {
      "id": "fhir",
      "name": "FHIR Bundle",
      "description": "Standards-compliant FHIR R4 JSON Bundle",
      "fileType": "application/json"
    },
    {
      "id": "archive",
      "name": "Full Archive",
      "description": "Complete ZIP archive with PDF, CSVs, FHIR JSON, and document manifest",
      "fileType": "application/zip"
    }
  ]
}
```

### GET `/api/export`

Downloads the export in the requested format.

**Auth:** Bearer token + consent required.

**Query parameters:**

| Param | Required | Type | Description |
|-------|----------|------|-------------|
| `format` | Yes | `pdf \| csv \| fhir \| archive` | Export format |
| `sections` | No | Comma-separated string | Filter by section (defaults to all) |
| `dateFrom` | No | ISO date string | Filter records from this date |
| `dateTo` | No | ISO date string | Filter records up to this date |

**Valid sections:** `conditions`, `medications`, `immunizations`, `allergies`, `encounters`, `procedures`, `observations`, `diagnosticReports`

**Response by format:**

| Format | Content-Type | Filename | Notes |
|--------|-------------|----------|-------|
| `pdf` | `application/pdf` | `health-summary.pdf` | Binary PDF buffer |
| `csv` | `text/csv` or `application/zip` | `{type}.csv` or `health-data.zip` | Single CSV if one section selected; ZIP if multiple |
| `fhir` | `application/json` | `fhir-bundle.json` | FHIR R4 Bundle with `type: "collection"` |
| `archive` | `application/zip` | `health-export.zip` | Contains `health-summary.pdf`, `csv/*.csv`, `fhir-bundle.json`, `documents-manifest.json` |

All responses include a `Content-Disposition: attachment; filename="..."` header.

**Error responses:**

| Status | Meaning |
|--------|---------|
| `400` | Invalid format or section name |
| `401` | Missing or invalid auth token |
| `403` | Consent not granted |
| `404` | No patient record found |
| `429` | Rate limited |

---

## Frontend Integration Guide

The following patterns are specific to the `phri-web-app` codebase.

### API layer changes (`src/lib/api.ts`)

The existing `apiFetch` always calls `.json()` on the response, which won't work for binary downloads. Add an `apiDownload` helper:

```typescript
/**
 * Download a file from the API. Returns the raw Response
 * so the caller can read it as blob, text, or JSON.
 */
export async function apiDownload(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    // Try to parse error body as JSON
    const body = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new ApiError(res.status, body.error ?? "Unknown error");
  }

  return res;
}
```

For the `/formats` endpoint, use the existing `api.get()` since it returns JSON:

```typescript
const { formats } = await api.get<ExportFormatsResponse>("/api/export/formats");
```

### Download trigger pattern

After fetching the export, trigger a browser download:

```typescript
async function downloadExport(format: string, sections?: string[], dateFrom?: string, dateTo?: string) {
  const params = new URLSearchParams({ format });
  if (sections?.length) params.set("sections", sections.join(","));
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);

  const res = await apiDownload(`/api/export?${params}`);
  const blob = await res.blob();

  // Extract filename from Content-Disposition header
  const disposition = res.headers.get("Content-Disposition") ?? "";
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
  const filename = filenameMatch?.[1] ?? `health-export.${format === "fhir" ? "json" : format}`;

  // Trigger browser download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

### Type definitions (`src/types/api.ts`)

Add these types:

```typescript
export interface ExportFormat {
  id: "pdf" | "csv" | "fhir" | "archive";
  name: string;
  description: string;
  fileType: string;
}

export interface ExportFormatsResponse {
  formats: ExportFormat[];
}

export interface ExportQuery {
  format: "pdf" | "csv" | "fhir" | "archive";
  sections?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export const EXPORT_SECTIONS = [
  "conditions",
  "medications",
  "immunizations",
  "allergies",
  "encounters",
  "procedures",
  "observations",
  "diagnosticReports",
] as const;

export type ExportSection = (typeof EXPORT_SECTIONS)[number];
```

---

## Suggested UI Components

### Export page

Create `src/pages/ExportPage.tsx` — a page (or modal) with:

1. **Format selector** — radio group or cards showing each format with name + description (fetched from `/api/export/formats`)
2. **Section filter** — checkboxes for each section (default: all selected). Use human-readable labels:
   - conditions → Conditions
   - medications → Medications
   - immunizations → Immunizations
   - allergies → Allergies
   - encounters → Encounters
   - procedures → Procedures
   - observations → Observations
   - diagnosticReports → Diagnostic Reports
3. **Date range** (optional) — two date inputs for `dateFrom` / `dateTo`
4. **Download button** — with loading/spinner state while the export is being generated

### Route placement

The export page should be behind `RequireAuth > RequireConsent > RequirePatient` guards (same as records/chat), since it needs patient data.

---

## Router integration (`src/router.tsx`)

Add a lazy-loaded route under the `RequirePatient > AppLayout` group:

```typescript
// At the top with other lazy imports
const ExportPage = lazy(() =>
  import("./pages/ExportPage").then((m) => ({ default: m.ExportPage })),
);

// Inside RequirePatient > AppLayout routes, alongside /chat
<Route
  path="/export"
  element={
    <Suspense fallback={<LazyFallback />}>
      <ExportPage />
    </Suspense>
  }
/>
```

### Navigation link

Add an export link to the sidebar navigation in `FloatingNav.tsx` and the mobile bottom bar in `AppLayout.tsx`. Suggested placement: after "Chat" or in the "Records" submenu. Use the `Download` icon from `lucide-react`.

---

## Error handling

Map backend errors to user-friendly toast messages:

```typescript
import { ApiError } from "../lib/api";
import { toast } from "sonner"; // or your toast library

async function handleExport(format: string, sections?: string[]) {
  try {
    await downloadExport(format, sections);
    toast.success("Export downloaded successfully");
  } catch (err) {
    if (err instanceof ApiError) {
      switch (err.status) {
        case 400:
          toast.error("Invalid export options. Please check your selections.");
          break;
        case 404:
          toast.error("No health records found. Connect your records first.");
          break;
        case 429:
          toast.error("Too many requests. Please wait a moment and try again.");
          break;
        default:
          toast.error(err.message || "Export failed. Please try again.");
      }
    } else {
      toast.error("Export failed. Please try again.");
    }
  }
}
```

The 401 and 403 cases are typically handled by the auth guards and `apiFetch` layer already — users without auth or consent won't reach the export page.
