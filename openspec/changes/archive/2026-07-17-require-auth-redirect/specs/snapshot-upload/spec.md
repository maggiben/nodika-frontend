## MODIFIED Requirements

### Requirement: Snapshot upload route

The application SHALL provide snapshot upload at `/upload` using the existing syntax validation and authenticated BFF upload flow. Unauthenticated requests to `/upload` SHALL redirect to the localized login page.

#### Scenario: Opening the upload route while signed in

- **WHEN** an authenticated user opens `/upload`
- **THEN** the page SHALL show the snapshot JSON editor and upload controls
- **AND** a successful upload SHALL persist the snapshot in Core and make it available to the dashboard via the BFF list

#### Scenario: Opening the upload route while signed out

- **WHEN** an unauthenticated user opens `/upload`
- **THEN** the application SHALL redirect to the localized login page
- **AND** SHALL not render the snapshot upload editor
