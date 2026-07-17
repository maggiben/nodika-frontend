## Context

`ProjectDashboard` mounts with an empty in-memory library and calls `refreshProjectLibrary()`. Until that promise resolves, `readSelectedSnapshotJson()` is null, so the component renders `EmptyDashboard` (upload CTA). Avatar menu already links to `/{locale}/upload`.

## Goals / Non-Goals

**Goals:**

- Avoid flashing the upload empty state during the initial Core library fetch
- Show a clear loading indicator until the first refresh settles
- Preserve empty-state upload CTA only when load completes with no snapshot

**Non-Goals:**

- Changing upload form, BFF, or Core APIs
- Shared library-ready flag for navbar selector / progress chip
- Auto-redirecting home to `/upload`

## Decisions

1. **Local `libraryReady` in `ProjectDashboard`** — Track readiness with `useState` + `refreshProjectLibrary().finally(...)`. Simpler than extending `snapshot-storage` for a one-screen flash.
2. **MUI `CircularProgress` + i18n label** — Match user preference for a spinner; keep accessibility via text (`dashboard.loading`).
3. **Empty state unchanged after load** — Still points users at avatar menu / upload CTA when Core has no sources.

## Risks / Trade-offs

- [Failed fetch still ends loading] → Empty state appears (same as today after load). Acceptable; no new error UI in this change.
- [SSR still null] → Client shows spinner after hydration until fetch completes; brief empty is replaced by loading gate.

## Migration Plan

Deploy frontend only. Rollback by reverting the dashboard loading gate.

## Open Questions

None.
