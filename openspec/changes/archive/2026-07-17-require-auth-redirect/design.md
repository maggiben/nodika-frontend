## Context

The BFF stores Core access/refresh tokens in HttpOnly cookies. Logout clears those cookies and refreshes the page, but home and upload remain reachable while signed out and render signed-out CTAs. Settings and staff already redirect per page. Users expect closing the session to leave them on login/register so project data is not visible.

Next.js 16 uses `src/proxy.ts` for edge routing (locale prefixing). That is the natural place for a shared allowlist-based auth redirect.

## Goals / Non-Goals

**Goals:**

- Redirect unauthenticated browser navigations away from app routes to `/{locale}/login`.
- Keep account auth pages public so users can sign in or register.
- After logout, navigate to login instead of staying on the previous route.
- Align OpenSpec with auth-gated browsing.

**Non-Goals:**

- Edge-side refresh-token rotation or Core calls from the proxy.
- Role-based authorization.
- Preserving `returnTo` deep links (login always lands post-success on home today).
- Changing cookie flags or BFF token APIs.

## Decisions

### Central guard in `src/proxy.ts`

After locale resolution, if the path is not in the public auth allowlist and the request lacks `nodika_access_token`, redirect to `/{locale}/login`.

Public paths (per locale): `login`, `register`, `forgot-password`, `reset-password`, `verify-email`.

Alternatives considered:
- Per-page `redirect()` helpers — already used for settings/staff; easy to miss new routes and does not cover home/upload.
- Client-only redirects — flashes protected UI; weaker for data exposure.

Cookie presence is sufficient for navigation gating; API routes already return 401 without a valid session.

### Logout navigates to login

`AppNavbar.logout` posts to `/api/auth/logout`, then `router.push(`/${locale}/login`)` and `router.refresh()` so the user leaves the protected view immediately.

### Auth pages stay public; no forced redirect when already signed in

Authenticated users may still open `/login` or `/register`. Avoids extra edge branches; forms already navigate home after success.

## Risks / Trade-offs

- [Cookie-only check without refresh at the edge] → Expired access cookie with valid refresh may briefly redirect to login until a BFF route refreshes; acceptable vs exposing the app unsigned. Future improvement: soft refresh before redirect.
- [Local HTTP + Secure cookies] → Already a known local-dev constraint; unchanged.
- [Tests that render home/upload unsigned] → Update to expect redirect or mock the access cookie.

## Migration Plan

1. Ship frontend change; no Core or env changes.
2. Rollback by reverting the commit; previous signed-out home CTA returns.

## Open Questions

None.
