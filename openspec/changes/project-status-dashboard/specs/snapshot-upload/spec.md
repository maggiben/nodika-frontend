## ADDED Requirements

### Requirement: Snapshot upload route

The application SHALL provide snapshot upload at `/upload` using the existing syntax validation and authenticated BFF upload flow.

#### Scenario: Opening the upload route while signed in

- **WHEN** an authenticated user opens `/upload`
- **THEN** the page SHALL show the snapshot JSON editor and upload controls
- **AND** a successful upload SHALL persist the snapshot JSON for the dashboard

#### Scenario: Opening the upload route while signed out

- **WHEN** an unauthenticated user opens `/upload`
- **THEN** the page SHALL require sign-in before enabling upload

## MODIFIED Requirements

### Requirement: Snapshot structure validation

The application SHALL reject syntactically invalid JSON before upload. It SHALL accept any JSON object that parses successfully, without enforcing snapshot field names, date ranges, uniqueness, or schema version semantics.

#### Scenario: Invalid JSON syntax

- **WHEN** the editor contains invalid JSON
- **THEN** the application SHALL display a syntax error
- **AND** the application SHALL not send an upload request

#### Scenario: Valid JSON object

- **WHEN** the editor contains a syntactically valid JSON object and the browser has an authenticated BFF session
- **THEN** the application SHALL allow submission without requesting or accepting a bearer token field
