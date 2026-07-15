## Why

Upload currently owns the landing page, so users cannot see project progress at a glance. The upload entry belongs in the account menu, the home page should visualize snapshot status, and light/dark themes currently render indistinguishably.

## What Changes

- Replace `/` with a project-status dashboard (labels, progress grids, and simple graphs derived from saved snapshot JSON).
- Move snapshot upload to `/upload` and link it from the authenticated avatar menu.
- Persist the last successfully validated/uploaded snapshot locally so the dashboard can render without inventing a new Core read API.
- **BREAKING (UX):** `/` no longer hosts the upload editor.
- Define explicitly distinct light and dark Material UI palettes so theme switching is visible.

## Capabilities

### New Capabilities

- `project-dashboard`: Home landing visualizes snapshot project progress.

### Modified Capabilities

- `home-page`: Home becomes the dashboard landing rather than upload.
- `snapshot-upload`: Upload lives at `/upload` and is reached from the avatar menu.
- `application-shell`: Authenticated avatar menu includes Upload snapshot.
- `material-ui-theming`: Light and dark schemes must be visually distinct.

## Impact

- `src/app/page.tsx`, new `src/app/upload/page.tsx`
- Snapshot persistence helper, dashboard components, navbar menu
- Theme palette definitions
- Home/snapshot/application-shell/material-ui-theming specs and tests
