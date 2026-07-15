## MODIFIED Requirements

### Requirement: Shared application navbar

The application SHALL render a shared navbar from the locale layout on every localized route, including a Nordika brand mark, a language switcher (Spanish/English), session-aware controls, and a project selector when locally stored projects exist. When authenticated, the avatar menu SHALL include an Upload snapshot action that navigates to the localized `/upload` route, theme preferences, and logout.

#### Scenario: Viewing any route while signed out

- **WHEN** an unauthenticated user opens any localized application route
- **THEN** the navbar SHALL show Sign in and Register actions targeting the active locale
- **AND** SHALL not show an avatar menu
- **AND** SHALL show a language switcher

#### Scenario: Viewing any route while signed in

- **WHEN** an authenticated user opens any localized application route
- **THEN** the navbar SHALL show an avatar control that opens a menu
- **AND** the menu SHALL include Upload snapshot, theme preferences, and a logout action that posts to the BFF logout route

#### Scenario: Switching projects from the navbar

- **WHEN** the local project library contains one or more projects
- **THEN** the navbar SHALL show a project selector listing those projects
- **AND** choosing a project SHALL make it the active dashboard selection
