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
- **AND** the application SHALL not require `schema_version`, task fields, or calendar date consistency

### Requirement: Server-side snapshot validation

The upload route SHALL validate that the request body is syntactically valid JSON and a JSON object, independently of client-side validation. It SHALL not enforce snapshot field schemas or semantic date rules.

#### Scenario: Bypassed client validation

- **WHEN** a request sends syntactically invalid JSON directly to `POST /api/snapshots`
- **THEN** the route SHALL return a 400 response with safe validation errors
- **AND** the route SHALL not forward the document to Core

#### Scenario: Valid object forwarded

- **WHEN** a request sends a syntactically valid JSON object with an authenticated BFF session
- **THEN** the route SHALL forward the document to Core without schema-field rejection
