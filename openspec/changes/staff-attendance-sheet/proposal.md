## Why

Operators already manage each jefe de obra’s team in the org chart and can draft WhatsApp attendance asks, but they still lack a durable **planilla de asistencia** to mark, search, tally, and export monthly results while keeping a full history. They need that sheet reachable from the organigrama, built with MUI Data Grid, using the same standard attendance marks already used in messaging.

## What Changes

- Add a localized attendance sheet per lead (`contactId`), reachable from the org-chart editor.
- Show the lead’s current org-chart reports in an MUI X Data Grid (rows = people, columns = days of the selected month) with standard marks: full day, half day, absent (and optional justified leave).
- Persist a complete mark history in the browser (no new Core API); month views are filters over that history, not destructive snapshots.
- Support employee name search/filter and live tallies (asistencias, medias, faltas) for the visible period and for a selected person.
- Export a monthly CSV report for the selected lead + month without deleting history.
- Extend org-chart / staff-org navigation and i18n (es/en) for the new surface.

## Capabilities

### New Capabilities

- `staff-attendance-sheet`: Per-lead attendance grid, history, search/tallies, and monthly CSV export.

### Modified Capabilities

- `staff-org-chart`: Add an entry point from the org-chart editor to the attendance sheet for that lead.

## Impact

- New route under `src/app/[locale]/staff/[contactId]/attendance`
- New Client Component + lib module for marks, storage, aggregation, and CSV export
- Org-chart editor link + breadcrumbs/i18n
- Vitest coverage for domain helpers (status parsing, tallies, export)
- Uses existing `@mui/x-data-grid`; no new npm dependencies
- Does **not** invent Core attendance endpoints; browser storage is the source of truth for marks until a future Core integration
