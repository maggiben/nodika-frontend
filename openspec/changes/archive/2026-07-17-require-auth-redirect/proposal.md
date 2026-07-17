## Why

After logout (or when visiting without a session), users can still open the dashboard and other app routes and see project UI. Session data must stay behind authentication so signed-out visitors are sent to login or register automatically.

## What Changes

- **BREAKING**: Unauthenticated requests to application routes (home, upload, settings, staff, etc.) SHALL redirect to the localized login page instead of rendering signed-out app content.
- Keep account recovery and registration routes public (`login`, `register`, `forgot-password`, `reset-password`, `verify-email`).
- After logout, navigate to the localized login page so the user does not remain on a protected view.
- Update OpenSpec requirements that currently allow public home/upload browsing while signed out.

## Capabilities

### New Capabilities

- `auth-route-guard`: Central unauthenticated redirect to login for non-public localized routes.

### Modified Capabilities

- `home-page`: Home is no longer publicly viewable without a session; unauthenticated users redirect to login.
- `application-shell`: Signed-out visitors no longer browse arbitrary localized routes with only navbar Sign in/Register.
- `snapshot-upload`: Opening `/upload` while signed out redirects to login instead of showing a disabled upload form.
- `bff-authentication`: Logout clears cookies and lands the user on the login page.

## Impact

- Frontend: `src/proxy.ts` (or shared auth guard), logout navigation in `app-navbar`, OpenSpec deltas, Vitest coverage for redirects.
- No Core API, cookie policy, or new environment variables.
- Non-goals: role-based authorization, middleware refresh-token rotation at the edge, returnTo deep-link restoration beyond login landing.
