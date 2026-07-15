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

The application SHALL load the Geist Sans and Geist Mono font variables and provide global typography and light/dark theme behavior through Material UI.

#### Scenario: Applying the document shell

- **WHEN** the root layout renders
- **THEN** the HTML element SHALL include both Geist font variable classes
- **AND** Material UI SHALL provide the active palette and baseline styles

### Requirement: Route metadata

The application SHALL provide title and description metadata through the root layout until route-specific metadata is introduced.

#### Scenario: Rendering the home route

- **WHEN** a user requests `/`
- **THEN** the response SHALL include the metadata exported by `src/app/layout.tsx`
