## ADDED Requirements

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
