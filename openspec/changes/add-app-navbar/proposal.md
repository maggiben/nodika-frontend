## Why

Session and appearance controls are buried in page-local buttons, and users cannot switch light/dark preferences from a global place. A shared navbar with an avatar menu gives consistent logout and theme access across routes.

## What Changes

- Add a shared application navbar to the root layout with brand mark and session-aware controls.
- Authenticated users get an avatar menu with logout and light/dark (and system) theme preferences.
- Unauthenticated users see sign-in and register actions in the navbar.
- Move session controls out of the home-page header into the shared navbar.
- Persist the selected color scheme so theme preference survives reloads.

## Capabilities

### New Capabilities

### Modified Capabilities

- `application-shell`: Add shared navbar chrome on every route.
- `material-ui-theming`: Expose and persist light/dark/system preference via Material UI color schemes.
- `home-page`: Remove page-local session controls in favor of the shell navbar.

## Impact

- `src/app/layout.tsx`, `src/app/page.tsx`
- New navbar component and theme preference wiring in `AppTheme`
- Session-control tests relocated/updated
- Application shell and Material UI theming specs
