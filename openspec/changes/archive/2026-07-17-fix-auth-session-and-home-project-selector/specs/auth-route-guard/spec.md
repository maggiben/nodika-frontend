## ADDED Requirements

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
