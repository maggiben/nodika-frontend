## MODIFIED Requirements

### Requirement: Snapshot upload route

The application SHALL provide snapshot upload at `/upload` using the existing syntax validation and authenticated BFF upload flow.

#### Scenario: Opening the upload route while signed in

- **WHEN** an authenticated user opens `/upload`
- **THEN** the page SHALL show the snapshot JSON editor and upload controls
- **AND** a successful upload SHALL persist the snapshot in Core and make it available to the dashboard via the BFF list

#### Scenario: Opening the upload route while signed out

- **WHEN** an unauthenticated user opens `/upload`
- **THEN** the page SHALL require sign-in before enabling upload

### Requirement: Upload activates project from Core

A successful snapshot upload SHALL set the account `activeProjectId` to the uploaded project's id and refresh the Core-backed project list. It MUST NOT write snapshot JSON into browser `localStorage`.

#### Scenario: Successful authenticated upload

- **WHEN** an authenticated user successfully uploads a snapshot on `/upload`
- **THEN** the application SHALL activate that project in account settings
- **AND** SHALL refresh projects from the BFF
- **AND** SHALL navigate to the home dashboard
