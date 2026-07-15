# User settings (delta)

## ADDED Requirements

### Requirement: Settings page access

The application SHALL expose a localized settings page for authenticated users.

#### Scenario: Opening settings while signed in

- **WHEN** an authenticated user navigates to `/[locale]/settings`
- **THEN** the application SHALL render settings sections for theme, language, password, and email notifications

#### Scenario: Opening settings while signed out

- **WHEN** an unauthenticated user navigates to `/[locale]/settings`
- **THEN** the application SHALL redirect to the localized login page

### Requirement: Simplified account menu

The avatar menu SHALL link to settings instead of inlining theme and language controls.

#### Scenario: Authenticated avatar menu

- **WHEN** an authenticated user opens the avatar menu
- **THEN** the menu SHALL include Settings, Upload snapshot, and Sign out
- **AND** SHALL NOT include theme or language selectors

### Requirement: Email-based avatar initials

The navbar avatar SHALL display the first two letters derived from the signed-in user email.

#### Scenario: Rendering avatar initials

- **WHEN** an authenticated user has email `maria@example.com`
- **THEN** the avatar SHALL show `MA`

### Requirement: Email notification schedule

Users SHALL configure email notification timing with weekly or monthly day selection and a send time, persisted through the BFF to Core.

#### Scenario: Saving a weekly schedule

- **WHEN** a user enables notifications, selects weekly frequency, picks weekdays, and saves
- **THEN** the BFF SHALL persist the schedule to Core
- **AND** the UI SHALL show upcoming send dates returned by Core
