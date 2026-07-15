## MODIFIED Requirements

### Requirement: Shared application navbar

The application SHALL render a shared navbar from the root layout on every route, including a Nordika brand mark and session-aware controls. When authenticated, the avatar menu SHALL include an Upload snapshot action that navigates to `/upload`, theme preferences, and logout.

#### Scenario: Viewing any route while signed out

- **WHEN** an unauthenticated user opens any application route
- **THEN** the navbar SHALL show Sign in and Register actions
- **AND** SHALL not show an avatar menu

#### Scenario: Viewing any route while signed in

- **WHEN** an authenticated user opens any application route
- **THEN** the navbar SHALL show an avatar control that opens a menu
- **AND** the menu SHALL include Upload snapshot, theme preferences, and a logout action that posts to the BFF logout route
