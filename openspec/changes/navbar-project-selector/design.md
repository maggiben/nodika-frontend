## Context

The home dashboard already reads a single `localStorage` key after upload. Users need multiple uploaded projects available from the navbar without requesting Core for a project list.

## Goals / Non-Goals

**Goals:**

- Store many uploaded snapshots locally, keyed by stable project identity from snapshot `meta`
- Navbar selector lists those projects and sets the active selection used by `/`
- Empty library keeps current empty-dashboard / upload guidance behavior

**Non-Goals:**

- Fetching projects from Nodika Core or any remote catalog
- Cross-device sync, account-scoped cloud history, or delete/rename UI beyond what’s needed to select
- Changing upload validation or Core forwarding

## Decisions

1. **Local multi-project store** — Replace the single JSON blob key with a library document: project entries (`id`, `name`, `json`, `updatedAt`) plus `selectedId`. Migrate the legacy `nodika.lastSnapshotJson` key once on read.
2. **Identity** — Prefer `meta.projectId`, else derive from `meta.projectNombre`, else generate a local id. Re-uploading the same `projectId` overwrites that entry.
3. **Navbar Select** — Visible whenever at least one project exists (signed in or out), placed between brand and account controls. Changing selection dispatches a storage-compatible update so the dashboard refreshes without a full reload.
4. **Same-tab updates** — `store` / `select` helpers notify subscribers (custom event or shared store callback) because native `storage` events do not fire in the same document.

## Risks / Trade-offs

- Local-only data is browser-bound → acceptable per prior dashboard decision; document in empty state if useful.
- Missing/unstable `projectId` can create duplicate rows → fallback identity is good enough for v1.

## Migration Plan

On first library read, if the library key is empty and the legacy key exists, parse the legacy JSON into one library entry, select it, write the new key, and leave or clear the legacy key.

## Open Questions

None blocking implementation.
