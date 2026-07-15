## MODIFIED Requirements

### Requirement: Shared Material UI theme

The application SHALL provide a shared Material UI theme to all routes with explicitly distinct light and dark palettes so switching modes changes background, paper, and text contrast in an immediately visible way. The active color scheme SHALL initialize early enough to avoid a visible wrong-scheme flash when a stored preference exists.

#### Scenario: Rendering an application route

- **WHEN** a user requests any application route
- **THEN** the route SHALL render within a Material UI theme provider
- **AND** Material UI baseline styles SHALL be applied

#### Scenario: Switching between light and dark

- **WHEN** a user selects Light theme then Dark theme from preferences
- **THEN** the page background and surface colors SHALL change between light and dark palettes
- **AND** primary text SHALL remain readable in both modes

#### Scenario: Restoring a stored color scheme

- **WHEN** a returning user has a stored light or dark preference
- **THEN** the document SHALL initialize that color scheme before interactive UI paints
