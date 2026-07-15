## Why

The dashboard currently keeps only the last uploaded snapshot, so uploading a second project replaces the first and the navbar cannot switch between projects. Uploaders need a top-nav project selector that lists every locally stored snapshot and drives the home dashboard.

## What Changes

- Persist multiple uploaded snapshot projects in browser local storage instead of a single last-snapshot value
- Show a project selector in the shared top navbar listing each stored project
- Selecting a project updates the home dashboard to that snapshot
- A successful upload upserts/selects that project so it appears in the selector immediately
- Migrate any existing single-snapshot local storage entry into the multi-project store

## Capabilities

### New Capabilities

- `project-library`: local multi-project snapshot library and active project selection

### Modified Capabilities

- `application-shell`: navbar includes a project selector when locally stored projects exist
- `project-dashboard`: dashboard visualizes the active selected project, not only the latest overwrite
- `snapshot-upload`: successful uploads add or update a project in the local library and select it

## Impact

- `src/lib/snapshot-storage.ts` and dependents (`project-dashboard`, upload form)
- `src/components/app-navbar.tsx`
- OpenSpec main specs for the capabilities above
- Focused Vitest coverage for storage, navbar selector, and dashboard selection
