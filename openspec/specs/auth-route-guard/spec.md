# Auth Route Guard

## Purpose

Define central browser navigation rules that keep application routes behind a Core access-token cookie while leaving account auth pages public.

## Requirements

### Requirement: Unauthenticated route redirect

The frontend SHALL redirect browser navigations that lack a Core access-token cookie to the localized login page, except for public account routes.

#### Scenario: Opening home while signed out

- **WHEN** an unauthenticated user requests `/{locale}` or `/{locale}/`
- **THEN** the application SHALL redirect to `/{locale}/login`
- **AND** SHALL not render the project dashboard

#### Scenario: Opening a protected app route while signed out

- **WHEN** an unauthenticated user requests `/{locale}/upload`, `/{locale}/settings`, `/{locale}/staff`, or another non-public localized app route
- **THEN** the application SHALL redirect to `/{locale}/login`

#### Scenario: Opening a public account route while signed out

- **WHEN** an unauthenticated user requests `/{locale}/login`, `/{locale}/register`, `/{locale}/forgot-password`, `/{locale}/reset-password`, or `/{locale}/verify-email`
- **THEN** the application SHALL render that account page without redirecting away for missing authentication

### Requirement: Expired in-app session redirect

Beyond the cookie-presence navigation guard, the frontend SHALL treat a BFF `401` during authenticated in-app use as a lost session and SHALL send the browser to the localized login page.

#### Scenario: Soft navigation after cookies were cleared by a prior 401

- **WHEN** a BFF response has cleared session cookies due to an unauthorized session
- **AND** the client redirects to `/{locale}/login`
- **THEN** subsequent navigations SHALL be governed by the existing unauthenticated route redirect rules

#### Scenario: Stale authenticated chrome must not persist

- **WHEN** the locale layout previously rendered with an access cookie present
- **AND** a later BFF call returns `401` for an expired or invalid session
- **THEN** the application SHALL leave the protected view by navigating to login
- **AND** SHALL not rely solely on inline error or sign-in prompt cards on that page
