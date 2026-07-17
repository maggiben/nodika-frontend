## MODIFIED Requirements

### Requirement: Shared application navbar

The application SHALL render a shared navbar from the locale layout on every localized route that is allowed to render, including a Nodika brand mark, session-aware controls, and a project selector when locally stored projects exist. When authenticated, the avatar menu SHALL include an Upload snapshot action that navigates to the localized `/upload` route, theme preferences where applicable, and logout. Unauthenticated users SHALL be redirected to login before app routes render, so signed-out browsing of protected routes SHALL not occur.

#### Scenario: Viewing a public account route while signed out

- **WHEN** an unauthenticated user opens a public account route such as `/{locale}/login` or `/{locale}/register`
- **THEN** the navbar SHALL show Sign in and Register actions targeting the active locale
- **AND** SHALL not show an avatar menu

#### Scenario: Viewing any route while signed in

- **WHEN** an authenticated user opens any localized application route
- **THEN** the navbar SHALL show an avatar control that opens a menu
- **AND** the menu SHALL include Upload snapshot and a logout action that posts to the BFF logout route

#### Scenario: Logging out

- **WHEN** an authenticated user invokes logout from the avatar menu
- **THEN** the client SHALL call the BFF logout route
- **AND** SHALL navigate to the localized login page

#### Scenario: Switching projects from the navbar

- **WHEN** the local project library contains one or more projects
- **THEN** the navbar SHALL show a project selector listing those projects
- **AND** choosing a project SHALL make it the active dashboard selection
