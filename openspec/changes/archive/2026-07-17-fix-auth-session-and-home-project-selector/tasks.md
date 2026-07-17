## 1. Session client helper

- [x] 1.1 Add `src/lib/session-client.ts` with locale-from-pathname helpers and `redirectToLoginIfUnauthorized(response)` that hard-navigates to `/{locale}/login` on BFF `401` except on public account routes
- [x] 1.2 Add Vitest coverage for the helper (401 redirects, non-401 no-op, public auth path no-op)

## 2. Reliable post-login navigation

- [x] 2.1 Update `AuthForm` so successful login/register uses `window.location.assign(\`/${locale}\`)` instead of soft `router.push`/`refresh`
- [x] 2.2 Update or add auth-form tests asserting hard home navigation after success

## 3. Wire unauthorized redirects

- [x] 3.1 Call the helper from shared authenticated fetch paths (`snapshot-storage`, `obra-progress`, `activate-active-project`)
- [x] 3.2 Call the helper from primary UI BFF callers (navbar settings load, settings form, staff messaging/catalog/org fetch sites) without changing credential-error handling on auth forms
- [x] 3.3 On home dashboard unauthorized library status, redirect to login instead of rendering `SignInDashboard`
- [x] 3.4 Update affected component/lib tests for 401 → login behavior

## 4. Home-only project chrome

- [x] 4.1 Gate `ProjectSelector` and `ObraProgressChip` in `AppNavbar` to `/{locale}` / `/{locale}/` via `usePathname`
- [x] 4.2 Update navbar tests for home visibility vs hidden on settings/staff/upload

## 5. Validation

- [x] 5.1 Run `npm run lint`, `npm test`, and `npm run build`
- [x] 5.2 Run `npm run spec:validate`
