# bff-authentication Specification

## Purpose

Define the frontend BFF authentication boundary and browser account-management flows for Nordika Core.

## Requirements

### Requirement: Server-mediated Core authentication

The frontend SHALL expose same-origin BFF routes for registration, login, refresh, logout, forgot-password, email verification, and password reset using the corresponding approved Core authentication endpoint. The routes SHALL obtain Core's base URL only from server-only `NODIKA_CORE_URL`, enforce bounded upstream requests, validate required client input, and return safe errors without forwarding Core tokens.

#### Scenario: Successful account login

- **WHEN** a visitor submits valid credentials to the frontend login route and Core returns tokens and an account
- **THEN** the route SHALL set both Core tokens in `Secure`, `HttpOnly`, `SameSite=Lax` cookies
- **AND** the JSON response SHALL contain account-facing data but no access or refresh token

#### Scenario: Missing Core configuration

- **WHEN** an authentication BFF route is invoked without `NODIKA_CORE_URL`
- **THEN** it SHALL return a generic 503 configuration error
- **AND** it SHALL not reveal an internal URL or stack trace

### Requirement: Cookie session lifecycle

The frontend SHALL retain the Core access and refresh tokens only in root-path `Secure`, `HttpOnly`, `SameSite=Lax` cookies. A successful refresh SHALL replace both cookies, and logout or failed refresh SHALL clear both cookies.

#### Scenario: Token refresh

- **WHEN** a request with a refresh cookie successfully refreshes its Core session
- **THEN** the BFF SHALL replace the access and refresh cookies with the returned tokens
- **AND** SHALL not return either token in its response body

#### Scenario: Failed refresh

- **WHEN** Core rejects a refresh token or returns an invalid refresh payload
- **THEN** the BFF SHALL clear both token cookies
- **AND** SHALL return a safe unauthorized response

### Requirement: Account management user flows

The application SHALL provide accessible Material UI and React Hook Form pages for register, login, email verification, forgotten-password submission, and password reset. It SHALL provide a logout affordance for authenticated users. Account forms SHALL submit only to same-origin BFF routes and SHALL never collect or display Core tokens.

#### Scenario: Password reset flow

- **WHEN** a visitor submits a valid reset token and replacement password
- **THEN** the page SHALL submit the token and password to the reset BFF route
- **AND** SHALL show a success or safe failure message

#### Scenario: Logout

- **WHEN** an authenticated user invokes logout
- **THEN** the client SHALL call the BFF logout route
- **AND** the browser session cookies SHALL be cleared
