## Context

Core accepts snapshot uploads but exposes no frontend-facing source listing yet. Themes currently enable `light: true` / `dark: true` defaults that do not read as distinct in this app shell.

## Goals / Non-Goals

**Goals:**

- Dashboard landing with project labels, progress summary, charts, and a task grid from snapshot JSON.
- Upload relocated to `/upload` behind authenticated avatar menu.
- Local persistence of last snapshot JSON after successful upload (and optional local preview load).
- Clearly different light and dark palettes.

**Non-Goals:**

- New Core GET `/sources` contract or server-side snapshot storage in the frontend.
- Heavy charting SDKs (use MUI + SVG/CSS charts).
- Editing tasks from the dashboard.

## Decisions

1. **Data source** — Persist last snapshot JSON in `localStorage` after successful upload; dashboard reads it client-side. Empty state prompts users to upload via the avatar menu.
2. **Metrics** — Derive total tasks, average/null-safe `avance_base`, cycle dates from `meta`, sector tallies when present, and tables for `tareas_con_objetivo` / `tareas_contexto`.
3. **Theme** — Replace boolean colorSchemes with explicit light (cool paper/slate text) and dark (near-black surfaces, brighter primary) palettes; keep `InitColorSchemeScript` + `useColorScheme`.
4. **Navigation** — Avatar menu adds “Upload snapshot” linking to `/upload`; unauthenticated users keep Sign in/Register only.

## Risks / Trade-offs

- [Dashboard empty on first visit] → Clear empty state with upload CTA for signed-in users.
- [localStorage-only freshness] → Acceptable until Core read APIs exist.
- [Chart depth] → Prefer readable progress bars/distribution over complex chart libs.

## Migration Plan

1. Ship theme fix + dashboard + upload route together.
2. Redeploy frontend.
3. Roll back by restoring previous home upload page if needed.

## Open Questions

None.
