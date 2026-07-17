## MODIFIED Requirements

### Requirement: Public home route

The application SHALL render the project-status landing dashboard at `/` only for authenticated sessions. Unauthenticated requests SHALL redirect to the localized login page.

#### Scenario: Requesting the root path while signed in

- **WHEN** an authenticated user requests `/`
- **THEN** the application SHALL return the localized home dashboard route
- **AND** the response SHALL contain one main content landmark and one level-one heading for the dashboard

#### Scenario: Requesting the root path while signed out

- **WHEN** an unauthenticated user requests `/`
- **THEN** the application SHALL redirect to the localized login page
- **AND** SHALL not render the project-status dashboard

#### Scenario: Opening the dashboard

- **WHEN** an authenticated uploader requests `/`
- **THEN** the page SHALL render the project-status dashboard
- **AND** the page SHALL not embed a Core bearer token in the server-rendered response
- **AND** the page SHALL not host the snapshot upload editor
