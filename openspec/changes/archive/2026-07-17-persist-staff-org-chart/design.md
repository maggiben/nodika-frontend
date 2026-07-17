## Context

Today `src/lib/staff-org-chart.ts` persists charts in `localStorage` keyed by Core contact id. The editor already loads the lead from `/api/messaging/roster` (or contacts fallback) but saves only locally. Core already stores multi-obra membership as `projectIds` on `WhatsAppContact`, and the roster displays them read-only. Sibling Core change `staff-org-chart-persistence` adds `orgReports` on the contact and replace semantics when PATCH sends `projectIds`.

## Goals / Non-Goals

**Goals:**

- Org chart reports for a jefe de obra are loaded from and saved to Core via the existing messaging BFF.
- The org-chart editor can assign the lead to zero or more projects from the Core-backed project library and persist that membership.
- Roster team-size and catalog draft helpers consume Core-backed charts (in-memory cache after fetch), not `localStorage`.

**Non-Goals:**

- Implementing Core schema/API (sibling repo).
- Automatic bulk migration of every browser’s local charts.
- Multi-level reporting trees or HR payroll features.

## Decisions

### 1. Persist reports on the contact document (via Core)

- **Choice:** Treat org chart as fields on the WhatsApp contact (`orgReports`), read from roster/contact JSON and written with `PATCH /api/messaging/contacts/:id`.
- **Why:** One document per lead; no new BFF resource; matches how `projectIds` already work.
- **Alt rejected:** Separate `/messaging/org-charts` resource — more surface area for the same data.

### 2. Replace localStorage module with a Core-backed client

- **Choice:** Refactor `staff-org-chart.ts` into typed parse/upsert helpers plus async fetch/save against the BFF; keep a memory map + event for `useSyncExternalStore` (same pattern as `snapshot-storage.ts`). Clear legacy `nodika.staffOrgCharts.v1` on load.
- **Why:** Callers (roster, drafts, editor) already depend on this module; keep one SRP storage abstraction.
- **Alt rejected:** Leave localStorage as offline cache — contradicts “database is source of truth” and risks silent divergence.

### 3. Project multi-select in the editor

- **Choice:** Multi-select of obras from `refreshProjectLibrary()` / project list; on save (or dedicated “Save membership” with reports), PATCH `{ projectIds: selectedIds }` so Core **replaces** membership. Singular create-contact flow keeps sending `projectId` (merge) unchanged.
- **Why:** Operators edit membership where they already edit the team; replace matches checkbox UI.
- **Alt rejected:** Only add projects (merge-only) — cannot unassign an obra from the editor.

### 4. Save UX

- **Choice:** Persist reports and `projectIds` together when the user adds/updates/removes a report or when they change project selection and confirm save (debounce or explicit Save for projects if needed). Show success/error from HTTP, not “saved on this device”.
- **Why:** One coherent contact update; fewer partial states.

### 5. DRY / SOLID

- Single module owns chart parse + BFF I/O; editor owns UI state; roster only reads counts from the shared store after refresh.
- Draft builders stay pure functions of a chart object.

## Risks / Trade-offs

- **[Risk] Core not deployed yet** → Frontend change blocked until Core `staff-org-chart-persistence` is live; feature-detect missing `orgReports` and show a clear error.
- **[Risk] Local charts lost** → Document that operators re-enter reports once; optional later import tool.
- **[Risk] Replace `projectIds` clears membership if UI loads empty** → Load current `projectIds` into the multi-select before first save; never PATCH `projectIds: []` unless the user cleared all selections intentionally.
- **[Risk] Roster team size stale** → Refresh org-chart store after editor save and on Staff mount via roster payload that includes `orgReports`.

## Migration Plan

1. Deploy Core change first (schema + replace semantics).
2. Deploy frontend: switch storage module, update editor + i18n, clear legacy localStorage key.
3. Rollback: revert frontend to localStorage module; Core fields remain harmless if unused.

## Open Questions

- Whether to offer a one-time “Import from this browser” button reading the legacy key (deferred unless product asks).
