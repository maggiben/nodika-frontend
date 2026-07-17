## 1. Auth route guard

- [x] 1.1 Extend `src/proxy.ts` with a public account-route allowlist and redirect unauthenticated requests (missing `nodika_access_token`) to `/{locale}/login`
- [x] 1.2 After logout in `app-navbar`, navigate to the localized login page and refresh session state

## 2. Tests and validation

- [x] 2.1 Add Vitest coverage for proxy auth redirects (public routes allowed, protected routes redirect when unsigned)
- [x] 2.2 Update navbar logout test expectations for navigation to login
- [x] 2.3 Run lint, related tests, and `npm run spec:validate`
