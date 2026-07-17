## Why

Deleting a project only removes Core `SourceOfTruth` rows. WhatsApp send history, task-checklist threads, and AI-parsed obra progress stay keyed by the same `projectId`. Re-uploading the snapshot (same `meta.projectId`) restores that advance as if the project was never deleted. Operators expect delete to wipe all progress for that obra.

## What Changes

- Extend project delete so that after Core accepts source deletion, **all progress tied to that `projectId` is gone**: catalog/WhatsApp send state, task-checklist threads, and live obra `%` (parsed inbound progress).
- Keep the existing frontend BFF `DELETE /api/snapshots/[projectId]` contract; Core’s `DELETE /sources/:projectId` becomes the cascade boundary (no new public delete API unless Core needs an internal helper).
- Update OpenSpec requirements for project delete so “success” means library refresh **and** a clean slate for progress if the same obra is uploaded again.
- Depend on sibling **nodika-core** to implement the cascade/cleanup and cache invalidation for messaging progress.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `project-library`: Successful project delete MUST clear all Core-backed progress for that `projectId`, not only snapshot sources.
- `settings-project-management`: Confirm-and-delete success criteria include that re-uploading the same obra starts with no prior WhatsApp/obra progress.

## Impact

- Frontend: mainly specs + any regression tests that assert post-delete empty progress when Core returns success; BFF proxy can stay a thin DELETE to `/sources/:projectId` if Core cascades in-place.
- Core (sibling `nodika-core`, required): on `deleteByProjectId`, remove or invalidate StaffMessage (and any dedicated progress docs) for that `projectId`, clear related checklist/catalog send state, strip that id from contact `projectIds`, invalidate progress caches.
- Non-goals: deleting unrelated catalog message *definitions* shared across obras; wiping staff contacts themselves; changing upload/`projectId` derivation from snapshot `meta`.
