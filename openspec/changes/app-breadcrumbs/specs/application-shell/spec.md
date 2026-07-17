## ADDED Requirements

### Requirement: Shared breadcrumb trail

The application SHALL render a shared breadcrumb trail below the navbar on localized authenticated app routes when the current path is deeper than Home. Ancestor crumbs SHALL be links to their locale-prefixed routes; the current page crumb SHALL be non-interactive text. The trail SHALL be omitted on Home and on public account routes (`login`, `register`, `forgot-password`, `reset-password`, `verify-email`).

#### Scenario: Viewing a top-level app page

- **WHEN** an authenticated user opens `/{locale}/staff`, `/{locale}/settings`, or `/{locale}/upload`
- **THEN** the shell SHALL show a breadcrumb trail starting with a Home link to `/{locale}`
- **AND** SHALL end with the current page label as non-link text

#### Scenario: Viewing a nested staff org-chart page

- **WHEN** an authenticated user opens `/{locale}/staff/[contactId]/org`
- **THEN** the breadcrumb trail SHALL include a Home link, a Staff link to `/{locale}/staff`, and a non-link Org chart label
- **AND** SHALL NOT present the raw contact id as a crumb

#### Scenario: Viewing Home

- **WHEN** a user opens `/{locale}`
- **THEN** the shell SHALL not render a breadcrumb trail

#### Scenario: Viewing a public account route

- **WHEN** a user opens a public account route such as `/{locale}/login`
- **THEN** the shell SHALL not render a breadcrumb trail
