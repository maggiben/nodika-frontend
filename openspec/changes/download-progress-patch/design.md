## Context

The selected project snapshot is held in memory (`readSelectedSnapshotJson`). Live AI-parsed progress from employee WhatsApp Q&A is fetched via `fetchObraProgress(projectId)` and today only overlays the dashboard view (`mergeDashboardWithLiveProgress`). Operators need the same merge applied to the raw snapshot JSON as a downloadable file.

## Goals / Non-Goals

**Goals:**

- Avatar menu item that downloads a full snapshot JSON with `avance_base` updated from live progress reports (first report per `taskId` wins, matching dashboard overlay).
- Disable or no-op safely when no project is selected or snapshot JSON is missing.
- Localized label: Spanish “Bajar patch”, English “Download patch”.

**Non-Goals:**

- Persisting the patch as a new Core source.
- Diff/patch format (RFC 6902); export is the full updated snapshot document.
- Server-side download route.

## Decisions

1. **Client-side merge + Blob download** — Build the patched JSON in the browser from the in-memory snapshot and a fresh `fetchObraProgress` call, then download via `Blob` + temporary `<a download>`. Keeps auth on existing BFF cookies and avoids inventing a Core export API.
2. **Patch raw snapshot shape, not dashboard model** — Walk `tareas_con_objetivo` / `tareas_contexto` and set `avance_base` from matching `taskId` percents so the file remains a valid Nodika snapshot for re-upload or external tools.
3. **Menu placement** — Add the action in `AppNavbar` avatar menu near Upload snapshot; pure `onClick` (not a Link).

## Risks / Trade-offs

- [Stale progress] → Fetch progress at click time rather than relying only on the navbar chip cache.
- [No live reports] → Still download the base snapshot (unchanged) so the action remains useful; do not block download solely because progress is empty.
- [Invalid snapshot JSON] → If parse fails, skip download and leave menu usable (no crash).

## Migration Plan

No migration. Feature is additive UI + pure helper.

## Open Questions

None — full-document JSON export (not a JSON Patch diff) matches the product request for “el json modificado o actualizado en su totalidad”.
