## MODIFIED Requirements

### Requirement: Shared application navbar

The application SHALL render a shared navbar from the root layout on every route, including a Nodika brand mark and session-aware controls. When one or more locally stored projects exist, the navbar SHALL include a project selector that switches the active dashboard project. When authenticated, the avatar menu SHALL include an Upload snapshot action that navigates to `/upload`, theme preferences, and logout.

#### Scenario: Viewing any route while signed out

- **WHEN** an unauthenticated user opens any application route
- **THEN** the navbar SHALL show Sign in and Register actions
- **AND** SHALL not show an avatar menu

#### Scenario: Viewing any route while signed in

- **WHEN** an authenticated user opens any application route
- **THEN** the navbar SHALL show an avatar control that opens a menu
- **AND** the menu SHALL include Upload snapshot, theme preferences, and a logout action that posts to the BFF logout route

#### Scenario: Switching projects from the navbar

- **WHEN** the local project library contains one or more projects
- **THEN** the navbar SHALL show a project selector listing those projects
- **AND** choosing a project SHALL make it the active dashboard selection
