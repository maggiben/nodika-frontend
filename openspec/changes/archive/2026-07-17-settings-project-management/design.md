## Context

Settings (`UserSettingsForm` on `/settings`) already manages appearance, locale, timezone, progress AI, and password. Projects are Core `SourceOfTruth` documents listed via BFF `GET /api/snapshots` and selected with account `activeProjectId`. Upload exists only on `/upload` (`POST /api/snapshots` → Core `POST /sources`). Core currently has **no** delete endpoint for sources, so delete cannot be implemented in the frontend alone.

## Goals / Non-Goals

**Goals:**

- Settings shows a Projects section: list library projects, upload CTA, delete with confirm.
- Reuse existing upload route and library refresh; no second JSON editor.
- BFF delete proxies Core once Core exposes authenticated delete by `projectId`.
- After delete, in-memory library and `activeProjectId` stay consistent.

**Non-Goals:**

- Inventing or shipping against an unapproved Core delete path.
- Inline snapshot editing, rename, or bulk delete on settings.
- Changing navbar selector UX beyond reacting to library updates.

## Decisions

1. **Compose a settings projects panel** — Client Component (e.g. `SettingsProjectsPanel`) composed into `UserSettingsForm`, same MUI Paper/Stack patterns. Keeps settings form from owning library I/O.

2. **Upload via navigation** — Primary CTA links to `/{locale}/upload` (same as avatar menu). Avoid duplicating CodeMirror upload UI on settings. Alternative considered: embed `SnapshotUploadForm` — rejected as larger surface and duplicate validation UX.

3. **Delete identity = `projectId`** — UI deletes an obra by `projectId` (what the library and selector use), not the Mongo source `id`. Core sibling change MUST remove that project from subsequent `GET /sources` (typically all SourceOfTruth rows for that `projectId`). Frontend BFF path shape follows the approved Core route (e.g. `DELETE /sources/:projectId`) without inventing extras here.

4. **Library helper owns delete + refresh** — Add a typed function in `snapshot-storage` (e.g. `deleteStoredProject(projectId)`) that calls BFF DELETE, then `refreshProjectLibrary()`. If deleted id was selected/`activeProjectId`, clear selection and PATCH settings to clear or switch to another listed project (prefer another project if any remain; otherwise `null`).

5. **Confirm before delete** — MUI dialog with project name; destructive action disabled while request in flight. Failures show a safe Alert; do not remove from UI until Core succeeds.

6. **Server vs Client** — Settings page stays a Server Component shell; projects panel is Client (library subscription, fetch, dialog). BFF route remains Route Handler with session cookies (same as GET/POST snapshots).

7. **Phased delivery** — Land settings list + upload CTA without Core delete. Gate delete UI/BFF behind Core delete availability (feature works only when BFF returns success; until Core ships, delete tasks stay blocked or return clear 501/503 from BFF). Prefer shipping Core delete in the same release window.

## Risks / Trade-offs

- [Core delete missing] → Document sibling Core OpenSpec change; frontend delete tasks blocked until Core route exists; list/upload CTA can ship earlier.
- [Stale `activeProjectId` after delete] → Always refresh library and PATCH settings in the same client flow after successful delete.
- [Staff `projectIds` still reference deleted obra] → Out of scope; org chart may show orphan ids until operators clear membership. Mitigate later if needed.
- [Navigate away for upload] → Slight friction vs inline upload; acceptable to avoid dual editors.

## Migration Plan

1. Propose/implement Core authenticated delete-by-`projectId` (sibling repo).
2. Frontend: settings list + upload CTA.
3. Frontend: BFF DELETE + library delete helper + confirm UI.
4. Rollback: remove settings section / BFF DELETE; Core delete can remain unused.

## Open Questions

- ~~Exact Core delete URL~~ → **Approved:** `DELETE /sources/:projectId` (hard-deletes all SourceOfTruth rows for that `projectId`; 200 with `{ projectId, deletedCount }`, 404 when none match). Frontend BFF: `DELETE /api/snapshots/:projectId`.
- Whether deleting the active project should auto-select the next listed project or clear selection to the empty dashboard state (default in this design: prefer another listed project if present, else clear).
