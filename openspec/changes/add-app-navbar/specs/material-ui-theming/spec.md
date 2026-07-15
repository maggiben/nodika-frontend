## MODIFIED Requirements

### Requirement: Shared Material UI theme

The application SHALL provide a shared Material UI theme to all routes and SHALL initialize the active color scheme early enough to avoid a visible wrong-scheme flash when a stored preference exists.

#### Scenario: Rendering an application route

- **WHEN** a user requests any application route
- **THEN** the route SHALL render within a Material UI theme provider
- **AND** Material UI baseline styles SHALL be applied

#### Scenario: Restoring a stored color scheme

- **WHEN** a returning user has a stored light or dark preference
- **THEN** the document SHALL initialize that color scheme before interactive UI paints
