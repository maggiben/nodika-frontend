## Context

Auth is cookie-based (`HttpOnly` Core access/refresh cookies). `src/proxy.ts` gates localized routes on **cookie presence**, not token validity. Login uses `AuthForm` → `POST /api/auth/login` (sets cookies) then `router.push` + `router.refresh()`. Client BFF callers treat `401` as local error UI; several clear cookies on the response but leave the user on the current page. The navbar always mounts `ProjectSelector` + `ObraProgressChip`, which only drive the home dashboard.

## Goals / Non-Goals

**Goals:**

- Reliable post-login/register landing on localized Home with a session the proxy can see.
- When the BFF reports an unauthorized session during in-app use, send the user to localized login (hard navigation) instead of leaving broken authenticated chrome.
- Show project selector and obra progress chip only on Home.

**Non-Goals:**

- Decoding JWTs in the proxy or validating Core tokens on every middleware hit.
- Rewriting every messaging form into a single data layer in this change (shared helper + wire critical shared fetch paths and high-traffic UI callers).
- Changing Core auth endpoints or cookie names/flags.
- Hiding settings project management UI (settings has its own projects section).

## Decisions

### 1. Hard navigation after successful login/register

- **Choice:** On successful `login` / `register`, use `window.location.assign(\`/${locale}\`)` (full document load) instead of `router.push` + `router.refresh`.
- **Why:** Soft App Router navigation can race with `Set-Cookie` from the fetch response, so Home sometimes renders as if still signed out or never leaves the form. A full load re-runs proxy + locale layout against the new cookies.
- **Alternatives considered:** Keep soft nav and `await` an extra `refresh` round-trip — still racy; server action login — larger rewrite.

### 2. Shared client unauthorized handler

- **Choice:** Add a small client helper (e.g. `src/lib/session-client.ts`) that, on BFF `401` while not already on a public auth route, performs `window.location.assign(\`/${locale}/login\`)`. Derive locale from the current path (same locale segment convention as the app). Call it from shared authenticated fetch paths (`snapshot-storage`, `obra-progress`, `activate-active-project`) and from primary UI fetch sites that already handle session (navbar settings load, settings form, staff messaging/catalog/org callers) so expired sessions do not strand the user with error chrome.
- **Why:** BFF already clears cookies on failed refresh/`401`; the missing piece is browser navigation. Central helper keeps DRY redirect rules.
- **Alternatives considered:** Global `fetch` monkey-patch — surprising and hard to test; RSC-only revalidation — does not cover soft client navigations mid-session.

### 3. Home unauthorized dashboard → redirect, not Sign-in card

- **Choice:** When the home dashboard library load returns unauthorized, invoke the same login redirect instead of rendering the legacy `SignInDashboard` prompt (proxy already requires auth for Home).
- **Why:** Matches “expired session → login” and avoids a dead-end signed-out card behind authenticated chrome.

### 4. Project chrome only on Home

- **Choice:** In `AppNavbar`, use `usePathname()` and render `ProjectSelector` + `ObraProgressChip` only when the path is exactly `/{locale}` or `/{locale}/`.
- **Why:** Selector and progress chip only affect the home dashboard; on staff/settings/upload they clutter the bar without a matching surface.
- **Alternatives considered:** Hide only the selector and keep the chip — chip without selector context is still home-dashboard UX; hide both.

## Risks / Trade-offs

- **[Risk]** Full reload after login feels slightly heavier → **Mitigation:** Acceptable for auth boundary; correctness over soft-nav polish.
- **[Risk]** Some ad-hoc `fetch` call sites miss the helper → **Mitigation:** Cover shared libs first; update high-traffic UI modules in the same change; leftover sites still clear cookies on `401` so the next navigation hits the proxy.
- **[Risk]** Redirect loops if login page itself gets a `401` → **Mitigation:** Helper no-ops on public auth paths; auth form calls do not use the session helper for credential errors.
- **[Risk]** Home-only selector surprises users who switched projects from other pages → **Mitigation:** Intended; active project remains in account settings and still applies when returning Home.

## Migration Plan

1. Land helper + auth-form hard redirect + navbar pathname gate + wire shared/fetch sites.
2. Update Vitest coverage for auth form navigation, navbar home-only chrome, and unauthorized redirect helper.
3. Rollback: revert the change; prior soft-nav and always-on selector behavior returns.

## Open Questions

- None blocking; locale derivation from pathname matches existing `/{locale}/...` routing.
