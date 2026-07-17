# Application Shell

## Purpose

Define the current root document behavior shared by all Nodika Frontend routes.

## Requirements

### Requirement: Root document language and layout

The application SHALL render every App Router route inside the root layout at `src/app/layout.tsx`.

#### Scenario: Rendering a route

- **WHEN** a user requests an application route
- **THEN** the response SHALL include an `html` element with a language attribute
- **AND** the route content SHALL render inside the document body

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

### Requirement: Route metadata

The application SHALL provide title and description metadata through the root layout until route-specific metadata is introduced.

#### Scenario: Rendering the home route

- **WHEN** a user requests `/`
- **THEN** the response SHALL include the metadata exported by `src/app/layout.tsx`
