## Context

Org charts already list each jefe de obra’s reports (`operario` / `jornalero` / `otro`) via Core + BFF. Catalog messaging can draft attendance asks with **Día completo / Media jornada / Faltó**, but operators cannot maintain a structured planilla, search a person, tally marks, or export a month while keeping history.

This frontend must not invent Core attendance APIs. Marks therefore live in browser storage; team membership still comes from the in-memory org chart hydrated from Core.

## Goals / Non-Goals

**Goals:**

- Authenticated route for a lead’s attendance sheet, linked from the org-chart editor.
- Month-oriented MUI X Data Grid: one row per current report, one column per calendar day, editable standard marks.
- Full historical store of marks keyed by `leadContactId` + `reportId` + `date` (ISO `YYYY-MM-DD`); changing the month only changes the view.
- Quick search by employee name and summary counts (full days, half days, absences, justified).
- Monthly CSV export for the selected lead + month.
- Shared domain module as single source of truth for statuses, tallies, and CSV (SOLID/DRY).

**Non-Goals:**

- Syncing attendance to Core / WhatsApp reply parsing into the grid.
- Payroll, overtime hours, or biometric clocks.
- Multi-lead bulk grids or cross-project rollups.
- New npm dependencies beyond existing `@mui/x-data-grid`.

## Decisions

1. **Standard mark set (aligned with existing template)**  
   Persist: `full_day` | `half_day` | `absent` | `justified` | unset (`null`).  
   Labels (es): Día completo, Media jornada, Faltó, Justificada.  
   **Why:** Matches catalog attendance wording; `justified` covers common planilla “falta justificada / licencia” without inventing a payroll model.  
   **Alternative:** Only the three WhatsApp choices — rejected because operators asked for standard planilla types and justified absences are routine on site.

2. **Grid shape: people × days**  
   Rows = org-chart reports for the lead; dynamic day columns for the selected `year-month`; sticky name/role + tally columns. Cell editors cycle or select a mark.  
   **Why:** Classic planilla layout; MUI Data Grid already used on Staff roster.  
   **Alternative:** One row per mark event — worse for monthly visual scanning.

3. **History vs monthly export**  
   Storage keeps all marks forever (per browser profile). Month selector and CSV are projections. Export NEVER deletes data.  
   **Why:** User requirement for complete history + monthly reports.  
   **Alternative:** One document per month that overwrites — rejected.

4. **Browser `localStorage` as mark source of truth**  
   Key e.g. `nodika.staffAttendance.v1` → `{ marks: Record<leadId, Record<reportId, Record<date, AttendanceStatus>>> }` (or equivalent nested maps serialized). In-memory cache + change event for UI, same pattern spirit as other client stores.  
   **Why:** No Core contract; constraints forbid inventing APIs.  
   **Alternative:** IndexedDB — deferred; localStorage is enough for team-sized sheets.

5. **Team membership from org chart, not from attendance store**  
   Grid rows always reflect current `readOrgChart(contactId).reports`. Marks for removed report ids remain in history (for past exports if we re-include by id later) but do not show as rows unless the report still exists. CSV for a month includes only people who still appear on the chart **or** who have at least one mark in that month (prefer: chart people + orphan marks listed in an appendix or only chart people — **Decision:** export rows = union of current reports and reportIds that have marks in that month, with name from chart when available else “Removed / (id)”).  
   **Why:** Preserves history when someone leaves the team mid-month.

6. **Search and tallies**  
   Toolbar search filters Data Grid rows by name (case-insensitive). Summary chips/text show counts for the filtered set over the selected month: `full_day`, `half_day`, `absent`, `justified`. Selecting one row (or narrowing search to one person) makes personal tallies obvious. Domain helper `summarizeAttendance(marks, range, reportIds)` owns the math. Half days count as half-day marks, not as full asistencias; “asistencias” UI = `full_day` count; show half separately.

7. **Routing & auth**  
   Mirror org page: `src/app/[locale]/staff/[contactId]/attendance/page.tsx` cookie-gates to login. Client component `StaffAttendanceSheet` loads chart + marks. Org editor gets a primary/secondary button “Planilla de asistencia” → that route. Breadcrumbs extend if the app pattern already scopes staff sub-routes.

8. **Module split**
   - `src/lib/staff-attendance.ts` — types, parse/serialize, get/set mark, month range helpers, summarize, buildCsv.
   - `src/lib/staff-attendance.test.ts` — pure tests.
   - `src/components/staff-attendance-sheet.tsx` — UI only, depends on lib + org chart.
   - Reuse status label maps near draft helpers or export shared constants from attendance lib so catalog copy stays consistent (optional thin re-export; do not duplicate status enums).

## Risks / Trade-offs

- **[Risk] Browser-only history is not shared across devices / clears on storage wipe** → Mitigation: document in UI helper text; CSV export as backup; future Core sync is a separate change.
- **[Risk] Wide month grid (31 day columns) on mobile** → Mitigation: compact density, horizontal scroll, sticky identity columns; month navigation remains desktop-first.
- **[Risk] Orphan marks after report rename/remove** → Mitigation: key by stable `reportId`; show orphans in export; UI rows follow current chart.
- **[Risk] localStorage quota** → Mitigation: marks are tiny enums; monitor size in tests with sample data; no binary blobs.

## Migration Plan

- No migration of existing Core data. Empty store on first visit.
- Rollback: remove route, org-chart link, component, lib, i18n keys; leftover `localStorage` key is harmless.

## Open Questions

- None blocking: justified mark included by default; can drop from UI later without schema break if we keep the enum value reserved.
