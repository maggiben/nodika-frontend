## Why

On home load the dashboard treats an empty in-memory library as “no snapshot,” so users briefly see the upload empty state while `GET /api/snapshots` is still in flight. That flash is misleading when Core already has sources; upload remains available from the avatar menu.

## What Changes

- Gate the home dashboard on the initial project-library refresh completing before choosing empty vs content UI
- Show a loading indicator (spinner + label) during that fetch
- Keep the empty upload CTA only after load when Core has no selectable snapshot
- Keep avatar-menu upload as the primary upload entry; empty-state CTA may still link to `/upload`

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `project-dashboard`: Clarify that the empty upload state appears only after the library has finished loading from Core, and that a loading state is shown meanwhile

## Impact

- `src/components/project-dashboard.tsx` and its tests
- `src/i18n/dictionaries/en.json` and `es.json` for a loading string
- OpenSpec `project-dashboard` requirement text
