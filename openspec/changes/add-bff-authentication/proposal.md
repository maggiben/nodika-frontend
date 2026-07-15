## Why

Snapshot uploads currently require users to paste a Core bearer token into the browser. Core now provides account authentication endpoints, so the frontend can establish an authenticated session without exposing tokens to client-side code.

## What Changes

- Add BFF authentication routes that proxy the approved Core authentication endpoints and keep access and refresh tokens in secure HttpOnly cookies.
- Add Material UI and React Hook Form account registration, login, email-verification, password-reset, and logout user flows.
- Require an authenticated browser session for snapshot uploads; remove the token input and client-side Authorization header.
- Update the snapshot BFF route to use the cookie-held access token, refresh once after a Core 401 response, and clear the session if refresh fails.
- Document the required server-only Core URL and authenticated upload behavior.

## Capabilities

### New Capabilities

- `bff-authentication`: Server-mediated account authentication and session lifecycle that never exposes Core tokens to client code.

### Modified Capabilities

- `snapshot-upload`: Replace client-supplied bearer tokens with authenticated BFF session forwarding.

## Impact

- Affected routes: new `src/app/api/auth/**` handlers and `src/app/api/snapshots/route.ts`.
- Affected UI: home page, snapshot upload form, and new account-flow pages/components.
- Core integration: approved `NODIKA_CORE_URL` server-only configuration and the provided Core `/auth/*` endpoints.
- Tests and project documentation will cover the cookie session boundary and authenticated upload behavior.
