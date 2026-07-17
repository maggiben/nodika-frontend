## Why

Operators need to manage obras from Configuración: today upload lives only on `/upload`, and there is no way to remove a project from Core once it is listed. Settings already hosts account preferences, so it is the natural place to list projects and offer upload/delete without leaving the admin surface.

## What Changes

- Add a **Projects** section on the authenticated `/settings` page that lists Core-backed projects from the existing project library.
- From that section, allow **uploading** a new (or replacement) snapshot—reuse the existing `/upload` flow (navigate with clear CTA), not a second editor.
- From that section, allow **deleting** a project after confirmation; on success, refresh the library and clear or reassign `activeProjectId` when the deleted project was active.
- Add authenticated BFF `DELETE /api/snapshots` (or equivalent) that proxies Core source deletion once Core exposes it.
- Add en/es copy for the new settings section, empty state, confirmations, and errors.

### Non-goals

- Renaming projects, editing snapshot JSON inline on settings, or bulk delete.
- Speculative Core contracts beyond “authenticated delete by `projectId`” coordinated with a sibling Core change.
- Moving appearance/locale/AI/password controls or changing navbar project selection beyond reacting to library refresh after delete.

### Acceptance criteria

- Authenticated user on `/settings` sees listed projects (name + id) when Core has sources.
- CTA from settings reaches the existing snapshot upload route and a successful upload still activates/refreshes as today.
- User can confirm and delete a project; it disappears from the settings list and navbar selector after refresh.
- Deleting the active project clears or switches `activeProjectId` so the dashboard does not keep a stale selection.
- Unauthenticated users still cannot reach `/settings` (existing auth guard).

## Capabilities

### New Capabilities

- `settings-project-management`: Projects section on `/settings` for listing, upload entry, and delete-with-confirm against the Core-backed library.

### Modified Capabilities

- `project-library`: Support removing a project from Core via BFF and refreshing the in-memory library; keep `activeProjectId` consistent after delete.
- `snapshot-upload`: Settings may deep-link to `/upload` as an alternate entry; upload behavior itself unchanged.

## Impact

- Frontend UI: `user-settings-form` (or a composed projects panel), i18n dictionaries, tests.
- Frontend lib: `snapshot-storage` (delete + refresh), possibly `activate-active-project` when active project is removed.
- BFF: `DELETE` on snapshots route proxying Core.
- **Depends on sibling Core change** exposing authenticated deletion of SourceOfTruth records for a `projectId` (all versions for that obra, or equivalent so the project no longer appears in `GET /sources`). Frontend implementation of delete MUST NOT ship against an invented Core path.
