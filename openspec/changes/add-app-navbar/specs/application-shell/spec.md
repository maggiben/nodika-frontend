## ADDED Requirements

### Requirement: Shared application navbar

The application SHALL render a shared navbar from the root layout on every route, including a Nordika brand mark and session-aware controls.

#### Scenario: Viewing any route while signed out

- **WHEN** an unauthenticated user opens any application route
- **THEN** the navbar SHALL show Sign in and Register actions
- **AND** SHALL not show an avatar menu

#### Scenario: Viewing any route while signed in

- **WHEN** an authenticated user opens any application route
- **THEN** the navbar SHALL show an avatar control that opens a menu
- **AND** the menu SHALL include a logout action that posts to the BFF logout route

## MODIFIED Requirements

### Requirement: Global typography and theme tokens

The application SHALL load the Geist Sans and Geist Mono font variables and provide global typography and light/dark theme behavior through Material UI. Users SHALL be able to choose light, dark, or system color scheme from the authenticated avatar preferences menu, and the chosen preference SHALL persist across reloads.

#### Scenario: Applying the document shell

- **WHEN** the root layout renders
- **THEN** the HTML element SHALL include both Geist font variable classes
- **AND** Material UI SHALL provide the active palette and baseline styles

#### Scenario: Changing theme preference

- **WHEN** an authenticated user selects Light or Dark from the avatar preferences menu
- **THEN** the Material UI color scheme SHALL update to the selected mode
- **AND** the preference SHALL remain after a full page reload
