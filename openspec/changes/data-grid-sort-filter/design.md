## Context

MUI X Community Data Grid already supports client-side sort and filter; the dashboard had turned the column menu off.

## Goals / Non-Goals

**Goals:**

- Sort by clicking column headers
- Filter via column menu filters and a quick filter in the toolbar
- Keep compact density and pagination

**Non-Goals:**

- Server-side filter/sort
- Pro/Premium features (multi-filter advanced panels beyond community defaults are fine if included in community toolbar)

## Decisions

1. Remove `disableColumnMenu`.
2. Set `showToolbar` so users get quick filter / filter button affordances.
3. Leave columns `sortable`/`filterable` (defaults true); ensure custom `valueGetter` columns remain filterable.
4. Keep `disableRowSelectionOnClick`.

## Risks / Trade-offs

Toolbar adds vertical space → acceptable for task exploration.

## Migration Plan

None.

## Open Questions

None.
