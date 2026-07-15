# Application Shell

## Purpose

Define the current root document behavior shared by all Nordika Frontend routes.

## Requirements

### Requirement: Root document language and layout

The application SHALL render every App Router route inside the root layout at `src/app/layout.tsx`.

#### Scenario: Rendering a route

- **WHEN** a user requests an application route
- **THEN** the response SHALL include an `html` element with `lang="en"`
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

The application SHALL render a shared navbar from the root layout on every route, including a Nordika brand mark and session-aware controls. When authenticated, the avatar menu SHALL include an Upload snapshot action that navigates to `/upload`, theme preferences, and logout.

#### Scenario: Viewing any route while signed out

- **WHEN** an unauthenticated user opens any application route
- **THEN** the navbar SHALL show Sign in and Register actions
- **AND** SHALL not show an avatar menu

#### Scenario: Viewing any route while signed in

- **WHEN** an authenticated user opens any application route
- **THEN** the navbar SHALL show an avatar control that opens a menu
- **AND** the menu SHALL include Upload snapshot, theme preferences, and a logout action that posts to the BFF logout route

### Requirement: Route metadata

The application SHALL provide title and description metadata through the root layout until route-specific metadata is introduced.

#### Scenario: Rendering the home route

- **WHEN** a user requests `/`
- **THEN** the response SHALL include the metadata exported by `src/app/layout.tsx`
