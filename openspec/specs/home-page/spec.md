# Home Page

## Purpose

Define the current behavior of the public landing route at `/`.

## Requirements

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

### Requirement: Responsive starter content

The home page SHALL render the project-status dashboard with Material UI components, remain responsive, and remain usable in light and dark color schemes.

#### Scenario: Viewing the page at a narrow width

- **WHEN** a user views `/` on a narrow viewport
- **THEN** the Material UI dashboard content SHALL fit the viewport without horizontal scrolling
- **AND** labels and task progress SHALL remain readable

### Requirement: External navigation safety

The home page SHALL protect external links that open in a new browsing context.

#### Scenario: Opening a starter resource

- **WHEN** a user activates an external home-page link
- **THEN** it SHALL open in a new tab
- **AND** the link SHALL include `rel="noopener noreferrer"`
