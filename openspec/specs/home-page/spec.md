# Home Page

## Purpose

Define the current behavior of the single public route at `/`.

## Requirements

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

### Requirement: Responsive starter content

The home page SHALL render the snapshot upload workflow with Material UI components, remain responsive, and remain usable in light and dark color schemes.

#### Scenario: Viewing the page at a narrow width

- **WHEN** a user views `/` on a narrow viewport
- **THEN** the Material UI upload controls SHALL fit the viewport without horizontal scrolling
- **AND** validation errors and submission status SHALL remain readable

### Requirement: External navigation safety

The home page SHALL protect external links that open in a new browsing context.

#### Scenario: Opening a starter resource

- **WHEN** a user activates an external home-page link
- **THEN** it SHALL open in a new tab
- **AND** the link SHALL include `rel="noopener noreferrer"`
