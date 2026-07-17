## Why

Successful login sometimes leaves the user on the auth page instead of Home because soft client navigation races with newly set session cookies. Separately, an expired Core session can leave cookies present long enough for soft navigation to keep rendering app chrome while BFF calls fail with errors—users should be sent to login. The navbar project selector (and its progress chip) only drives the home dashboard, so it should not appear on other routes.

## What Changes

- After successful login or register, navigate to the localized home with a full document navigation so the proxy and locale layout always see the new session cookies.
- When authenticated client fetches receive a BFF `401` (session cleared or invalid), redirect the browser to the localized login page instead of leaving broken in-app UI.
- Show the navbar project selector and obra progress chip only on the localized home route (`/{locale}` or `/{locale}/`).

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `bff-authentication`: Successful login/register MUST land on home reliably; expired/invalid client sessions MUST redirect to login.
- `auth-route-guard`: Clarify client-side handling when a previously valid session becomes unauthorized during in-app use.
- `application-shell`: Project selector (and companion progress chip) visible only on Home.

## Impact

- Frontend: `auth-form`, `app-navbar`, shared client fetch/session helper(s), possibly dashboard/settings/staff callers that already handle `401`.
- Specs: `bff-authentication`, `auth-route-guard`, `application-shell`.
- Tests: auth form navigation, navbar home-only selector, 401 → login redirect.
- No Core API contract changes; no new env vars.
