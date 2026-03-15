# Rich Epic Sync Progress UX

## Context
After Epic OAuth completes, the EpicProgressPage shows "18 of 19 categories" instantly then hangs for ~15s waiting for the last category (Vitals times out). The raw counter jumping to 18/19 feels broken. We need to show per-category detail at a human-readable pace. Must not touch Metriport/PDF upload flows — they are completely separate pages and hooks.

## Problem
- All 19 FHIR fetches run in parallel. 17 succeed in ~1s, MedicationRequest 403 fails in ~1s (= 18 done), Vitals hangs 15s before timeout.
- Frontend only sees `completed: 18, total: 19` — no per-category info, no way to show what was downloaded.
- After sync ends, `activeSyncs.delete(userId)` runs immediately, so next poll may miss the final progress.

## Plan

### 1. Backend: Add `completedCategories` to SyncProgress
**File: `phri-backend/src/services/epic-sync.service.ts`**

Add to `SyncProgress` interface (line 52):
```typescript
interface SyncProgress {
  total: number;
  completed: number;
  errors: string[];
  completedCategories: Array<{ label: string; count: number }>;
}
```

Initialize in `syncAllResources` (line 87):
```typescript
const progress: SyncProgress = {
  total: RESOURCE_CONFIGS.length,
  completed: 0,
  errors: [],
  completedCategories: [],
};
```

Push to `completedCategories` in all three completion paths inside the `.map()` callback:
- **No-data (4101)**: `progress.completedCategories.push({ label, count: 0 });`
- **Success**: `progress.completedCategories.push({ label, count });`
- **Error**: `progress.completedCategories.push({ label, count: -1 });` (use -1 to signal error)

### 2. Backend: Delay `activeSyncs` cleanup by 30s
**File: `phri-backend/src/services/epic-sync.service.ts`** (line 224)

Replace `activeSyncs.delete(userId)` with:
```typescript
setTimeout(() => activeSyncs.delete(userId), 30_000);
```

This ensures the frontend can still poll and see the final progress after sync ends.

### 3. Frontend types: Update `EpicStatus`
**File: `phri-web-app/src/types/api.ts`**

Add `completedCategories` to `syncProgress`:
```typescript
syncProgress?: {
  total: number;
  completed: number;
  errors: string[];
  completedCategories: Array<{ label: string; count: number }>;
};
```

### 4. Frontend: Queue-based category reveal in EpicProgressPage
**File: `phri-web-app/src/pages/EpicProgressPage.tsx`**

**Core idea**: Maintain a `revealedCategories` array. Each poll may add new items to a queue. A 700ms interval shifts one item from queue → revealed. This gives a smooth drip-feed effect.

Key changes:
- Add state: `revealedCategories` (displayed list), `queueRef` (buffer of items not yet shown)
- On each poll, diff `epicStatus.syncProgress.completedCategories` against what's already queued/revealed, push new items to queue
- `useEffect` with 700ms `setTimeout` chain drains queue one item at a time into `revealedCategories`
- Step gate: Don't advance past step 1 ("Downloading") until the reveal queue is fully drained AND backend reports sync complete
- Replace the simple "X of Y categories" sub-label with a scrollable feed of revealed categories
- Each category shows: check icon (success, count > 0), dash (no data, count = 0), or warning icon (error, count = -1), plus label and record count

**UI structure** (replaces current sub-label area under step 1):
```
✓ Allergies — 3 records
✓ Problems — 12 records
✓ Encounter Diagnoses — 8 records
– Health Concerns — no data
✓ Labs — 24 records
⚠ Vitals — unavailable
  ... (items appear one by one at ~700ms)
```

Max height with overflow-y-auto so it doesn't push the page layout around. Fade-in animation on each new item.

### 5. Scope boundaries — DO NOT modify
- `src/pages/ProgressPage.tsx` (Metriport)
- `src/pages/UploadProgressPage.tsx` (PDF upload)
- `src/hooks/usePatientStatus.ts` (Metriport polling)
- `src/hooks/useDocumentUpload.ts` (PDF SSE)
- `src/context/HealthDataContext.tsx`
- `src/context/AuthContext.tsx`

## Files to Modify
1. `phri-backend/src/services/epic-sync.service.ts` — add completedCategories to SyncProgress, delay cleanup
2. `phri-web-app/src/types/api.ts` — update EpicStatus type
3. `phri-web-app/src/pages/EpicProgressPage.tsx` — queue-based category feed UI

## Verification
1. Deploy backend, trigger Epic OAuth, observe EpicProgressPage
2. Categories should appear one-by-one at ~700ms intervals, not all at once
3. Error categories (Vitals, MedicationRequest) show warning state
4. After sync completes, page advances to "ready" step and navigates to /home
5. Metriport flow (`/progress`) and PDF upload (`/upload-progress`) still work unchanged
6. Polling stops after sync completes (check Network tab — no requests after navigation)
