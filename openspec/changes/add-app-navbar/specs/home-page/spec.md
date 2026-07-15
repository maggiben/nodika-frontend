## MODIFIED Requirements

### Requirement: Public home route

The application SHALL render a public home page at `/` with the snapshot upload workflow without requiring frontend authentication. Session actions SHALL come from the shared application navbar rather than a home-page-local control cluster.

#### Scenario: Requesting the root path

- **WHEN** a user requests `/`
- **THEN** the application SHALL return the `src/app/page.tsx` route
- **AND** the response SHALL contain one main content landmark and one level-one heading

#### Scenario: Opening the upload workflow

- **WHEN** an uploader requests `/`
- **THEN** the page SHALL render the snapshot upload editor and validation summary
- **AND** the page SHALL not embed a Core bearer token in the server-rendered response
- **AND** the page SHALL not duplicate Sign in, Register, or Sign out controls outside the shared navbar
