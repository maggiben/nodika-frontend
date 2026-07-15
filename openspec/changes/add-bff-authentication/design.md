## Context

The App Router frontend currently accepts a pasted Core JWT for snapshot uploads. Core now publishes the approved authentication endpoints and token response shape. The frontend must remain the token boundary: browser JavaScript receives account-facing status only, while route handlers read, set, rotate, and clear Core tokens in cookies.

## Goals / Non-Goals

**Goals:**

- Proxy Core authentication endpoints through same-origin BFF routes with server-side input validation, timeouts, and safe errors.
- Store tokens exclusively in `Secure`, `HttpOnly`, `SameSite=Lax`, path-root cookies and rotate both cookies after a refresh.
- Provide accessible MUI/React Hook Form account and password-recovery flows.
- Forward snapshot uploads using the cookie-held access token and retry once after a successful token refresh.

**Non-Goals:**

- Adding Core endpoints, persistent frontend identity storage, role-management UI, middleware-based page access control, deployments, or environment provisioning.

## Decisions

### BFF routes own the Core session

Handlers under `/api/auth` call the approved Core routes using `NODIKA_CORE_URL`; register, login, and refresh turn token payloads into cookies and return only `account` or a generic success result. Logout forwards the refresh token when present and clears cookies regardless of the Core response.

This avoids JavaScript-readable tokens and local/session storage. A direct client-to-Core model was rejected because it violates the required token boundary.

### Shared server-only authentication helpers

A server-only `src/lib` module will centralize Core URL resolution, bounded fetches, token-payload parsing, cookie option construction, cookie clearing, and one-time refresh behavior. Snapshot forwarding can then share the same validation and failure rules without importing client code.

Duplicating request logic per route was rejected because cookie flags and safe error handling would drift.

### Page-level account flows

The homepage remains publicly viewable but renders the upload form only after an authenticated session marker is established by the BFF. Client components submit forms to same-origin BFF routes and navigate after success; no component reads token cookies. Login, registration, password request, reset, and verification each use accessible MUI fields and React Hook Form validation.

Client-side auth checks are UX only; the snapshot route remains the server authorization boundary.

## Risks / Trade-offs

- [Secure cookies are not sent over plain HTTP during local development] → preserve the required secure flag; developers must use HTTPS-capable local testing when exercising full browser sessions.
- [Core error payloads may vary] → translate failures into fixed safe messages and validate all success payloads before setting cookies.
- [A refreshed token can still fail the retried upload] → retry exactly once, return Core's mapped failure, and do not loop.
- [`SameSite=Lax` does not replace CSRF controls for every unsafe same-site request] → BFF endpoints remain same-origin and are scoped to the requested cookie policy; future cross-origin exposure requires a CSRF design.

## Migration Plan

1. Release frontend code with `NODIKA_CORE_URL` documented as a server-only runtime requirement.
2. Existing pasted-token uploads stop working and users sign in through the new account flow.
3. If rollback is required, revert the frontend change; no Core data or environment changes are performed by this work.

## Open Questions

None. The Core endpoint payloads and cookie policy are explicitly provided.
