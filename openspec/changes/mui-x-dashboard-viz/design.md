## Context

The landing dashboard already models snapshot progress locally. Visualization should use official MUI X Community components rather than custom SVG/table markup.

## Goals / Non-Goals

**Goals:**

- Use `@mui/x-charts` Gauge + BarChart for progress and bucket charts
- Use `@mui/x-data-grid` for objective/context task grids
- Keep empty states when no data exists

**Non-Goals:**

- Pro/Premium MUI X features or license keys
- Server-side chart rendering
- Changing snapshot parsing or project library behavior

## Decisions

1. Install community packages `@mui/x-charts` and `@mui/x-data-grid` aligned with Material UI v9.
2. Gauge for average progress; horizontal BarCharts for duration mix and sector counts.
3. DataGrid with fixed height, auto page size or density compact, columns for label/sector/duration/progress/window.
4. Prefer subpath imports (`@mui/x-charts/Gauge`, `@mui/x-charts/BarChart`) for narrower bundles when practical.

## Risks / Trade-offs

- Larger client bundle → acceptable for authenticated dashboard UX.
- jsdom tests may need selectors updated (grid cells vs table cells).

## Migration Plan

None beyond dependency install and component swap.

## Open Questions

None.
