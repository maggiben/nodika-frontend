## 1. Server session boundary

- [x] 1.1 Create a server-only Core authentication helper with token payload validation, safe failures, cookie rotation, and cookie clearing.
- [x] 1.2 Implement BFF authentication route handlers for all approved Core account endpoints.
- [x] 1.3 Update the snapshot upload route to authorize with cookie tokens, refresh exactly once after Core 401, and clear failed sessions.

## 2. Account and upload UI

- [x] 2.1 Build accessible MUI and React Hook Form register, login, verification, forgot-password, and reset-password pages.
- [x] 2.2 Add authenticated-session UI state and logout affordance to the home page.
- [x] 2.3 Remove the snapshot token field and submit uploads without a client Authorization header.

## 3. Verification and documentation

- [x] 3.1 Add route and UI tests covering session cookies, safe failures, refresh retry, account flows, logout, and authenticated uploads.
- [x] 3.2 Update README with local configuration and token-handling documentation.
- [x] 3.3 Run coverage, formatting, lint, production build, and strict OpenSpec validation.
