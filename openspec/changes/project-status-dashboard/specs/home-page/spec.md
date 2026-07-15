## MODIFIED Requirements

### Requirement: Public home route

The application SHALL render a public home page at `/` as the project-status landing dashboard without requiring frontend authentication to view available local snapshot visualizations.

#### Scenario: Requesting the root path

- **WHEN** a user requests `/`
- **THEN** the application SHALL return the `src/app/page.tsx` route
- **AND** the response SHALL contain one main content landmark and one level-one heading for the dashboard

#### Scenario: Opening the dashboard

- **WHEN** an uploader requests `/`
- **THEN** the page SHALL render the project-status dashboard
- **AND** the page SHALL not embed a Core bearer token in the server-rendered response
- **AND** the page SHALL not host the snapshot upload editor
