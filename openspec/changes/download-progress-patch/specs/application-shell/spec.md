## MODIFIED Requirements

### Requirement: Shared application navbar

The application SHALL render a shared navbar from the locale layout on every localized route, including a Nodika brand mark, a language switcher (Spanish/English), session-aware controls, and a project selector when locally stored projects exist. When authenticated, the avatar menu SHALL include an Upload snapshot action that navigates to the localized `/upload` route, a Download patch action that downloads the selected project’s snapshot JSON patched with live AI-derived progress, theme preferences, and logout.

#### Scenario: Viewing any route while signed out

- **WHEN** an unauthenticated user opens any localized application route
- **THEN** the navbar SHALL show Sign in and Register actions targeting the active locale
- **AND** SHALL not show an avatar menu
- **AND** SHALL show a language switcher

#### Scenario: Viewing any route while signed in

- **WHEN** an authenticated user opens any localized application route
- **THEN** the navbar SHALL show an avatar control that opens a menu
- **AND** the menu SHALL include Upload snapshot, Download patch, theme preferences, and a logout action that posts to the BFF logout route

#### Scenario: Switching projects from the navbar

- **WHEN** the local project library contains one or more projects
- **THEN** the navbar SHALL show a project selector listing those projects
- **AND** choosing a project SHALL make it the active dashboard selection

#### Scenario: Downloading the progress patch

- **WHEN** an authenticated user chooses Download patch from the avatar menu and a project is selected
- **THEN** the application SHALL download a JSON file for that project with live progress applied to task `avance_base` values
