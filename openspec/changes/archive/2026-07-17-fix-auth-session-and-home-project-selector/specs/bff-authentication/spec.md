## ADDED Requirements

### Requirement: Post-login home navigation

After a successful login or register BFF response that sets session cookies, the account form SHALL navigate the browser to the localized home route with a full document load so the auth proxy and locale layout observe the new session.

#### Scenario: Successful login reaches home

- **WHEN** a visitor submits valid credentials to the login form
- **AND** the login BFF route returns success and sets session cookies
- **THEN** the browser SHALL navigate to `/{locale}` (or `/{locale}/`) via a full document load
- **AND** the home route SHALL render as authenticated

#### Scenario: Successful register reaches home

- **WHEN** a visitor completes registration successfully through the register form
- **AND** the register BFF route returns success and sets session cookies
- **THEN** the browser SHALL navigate to `/{locale}` (or `/{locale}/`) via a full document load

### Requirement: Client unauthorized session redirect

When an authenticated client request to a same-origin BFF route receives HTTP `401` because the Core session is missing or no longer valid, the frontend SHALL redirect the browser to the localized login page via a full document load, except when the user is already on a public account route.

#### Scenario: Expired session during authenticated fetch

- **WHEN** a signed-in user is on a protected app route
- **AND** a BFF request returns `401` after failed refresh or missing session
- **THEN** the client SHALL navigate to `/{locale}/login` via a full document load
- **AND** SHALL not leave the user on the protected page with only inline error UI

#### Scenario: Unauthorized response on a public account route

- **WHEN** a public account route performs an auth form request that returns `401` (e.g. invalid credentials)
- **THEN** the client SHALL show the form error
- **AND** SHALL not redirect away from that account page solely due to that `401`
