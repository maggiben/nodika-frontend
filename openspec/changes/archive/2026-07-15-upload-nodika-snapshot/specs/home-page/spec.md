## MODIFIED Requirements

### Requirement: Public home route

The application SHALL render a public home page at `/` with the snapshot upload workflow without requiring frontend authentication.

#### Scenario: Requesting the root path

- **WHEN** a user requests `/`
- **THEN** the application SHALL return the `src/app/page.tsx` route
- **AND** the response SHALL contain one main content landmark and one level-one heading

#### Scenario: Opening the upload workflow

- **WHEN** an uploader requests `/`
- **THEN** the page SHALL render the snapshot upload editor and validation summary
- **AND** the page SHALL not embed a Core bearer token in the server-rendered response

### Requirement: Responsive starter content

The home page SHALL render the snapshot upload workflow responsively and remain usable in light and dark color schemes.

#### Scenario: Viewing the page at a narrow width

- **WHEN** a user views `/` on a narrow viewport
- **THEN** the upload controls SHALL fit the viewport without horizontal scrolling
- **AND** validation errors and submission status SHALL remain readable
