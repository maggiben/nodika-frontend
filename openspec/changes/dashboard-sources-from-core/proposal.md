## Why

The dashboard and project selector keep a duplicate copy of uploaded snapshot JSON in browser `localStorage`, even though Core already persists `SourceOfTruth` in MongoDB. That cache desyncs when sources are deleted server-side, does not survive across devices, and contradicts centralizing project data in the database.

## What Changes

- **BREAKING**: Stop persisting snapshot JSON / project library in `localStorage` (`nodika.projectLibrary.v1` and legacy keys).
- Load the navbar project list and selected snapshot content from Core via a new authenticated BFF `GET /api/snapshots`.
- Keep `activeProjectId` on account settings as the selected obra (already synced on select/upload).
- After upload, activate the project in Core and refresh the server-backed library instead of writing local storage.
- Update project-dashboard, project-library, and snapshot-upload requirements to describe Core-backed sources instead of a local library.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `project-library`: Replace localStorage multi-project library with Core-backed source listing + account `activeProjectId`.
- `project-dashboard`: Dashboard reads the selected project's snapshot from Core (via BFF), not local storage.
- `snapshot-upload`: Successful upload no longer upserts localStorage; it refreshes Core-backed projects and sets active project.

## Impact

- Frontend: `src/lib/snapshot-storage.ts` removed or reduced to a fetch-backed in-memory store; `project-selector`, `project-dashboard`, `obra-progress-chip`, `snapshot-upload-form`, `staff-messaging-form`, and related tests.
- BFF: add `GET /api/snapshots` proxying Core `GET /sources`.
- Depends on sibling Core change exposing authenticated source listing (latest snapshot per `projectId`, including content for the dashboard).
