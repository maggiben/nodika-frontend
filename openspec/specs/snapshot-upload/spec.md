# snapshot-upload Specification

## Purpose

TBD - created by archiving change upload-nodika-snapshot. Update Purpose after archive.

## Requirements

### Requirement: Snapshot upload route

The application SHALL provide snapshot upload at `/upload` using the existing syntax validation and authenticated BFF upload flow. Unauthenticated requests to `/upload` SHALL redirect to the localized login page. The upload page SHALL include both the JSON editor and a local `.json` file picker that fills the editor.

#### Scenario: Opening the upload route while signed in

- **WHEN** an authenticated user opens `/upload`
- **THEN** the page SHALL show the snapshot JSON editor, a control to load a local `.json` file, and upload controls
- **AND** a successful upload SHALL persist the snapshot in Core and make it available to the dashboard via the BFF list

#### Scenario: Opening the upload route while signed out

- **WHEN** an unauthenticated user opens `/upload`
- **THEN** the application SHALL redirect to the localized login page
- **AND** SHALL not render the snapshot upload editor

### Requirement: Upload activates project from Core

A successful snapshot upload SHALL set the account `activeProjectId` to the uploaded project's id and refresh the Core-backed project list. It MUST NOT write snapshot JSON into browser `localStorage`.

#### Scenario: Successful authenticated upload

- **WHEN** an authenticated user successfully uploads a snapshot on `/upload`
- **THEN** the application SHALL activate that project in account settings
- **AND** SHALL refresh projects from the BFF
- **AND** SHALL navigate to the home dashboard

### Requirement: JSON snapshot editor

The application SHALL provide an editor for entering snapshot JSON with JSON syntax highlighting, and SHALL provide a control to load snapshot JSON from a local `.json` file into that editor.

#### Scenario: Editing a snapshot

- **WHEN** an uploader opens the upload page
- **THEN** the application SHALL show a JSON-highlighted editor with a snapshot template
- **AND** the uploader SHALL be able to replace its content by editing or by loading a local `.json` file

### Requirement: Local JSON file load into editor

The snapshot upload page SHALL allow the uploader to choose a local `.json` file and load its text into the existing snapshot JSON editor. Loading a file MUST NOT bypass syntax validation or the authenticated BFF upload path. The editor and paste/edit path SHALL remain available.

#### Scenario: Choosing a valid JSON file

- **WHEN** an uploader selects a local file whose name ends in `.json`
- **AND** the browser successfully reads the file as text
- **THEN** the application SHALL replace the editor content with that text
- **AND** the application SHALL run the same client-side JSON syntax validation as for pasted content
- **AND** the application SHALL not upload until the user submits

#### Scenario: Rejecting a non-JSON file

- **WHEN** an uploader selects a file whose name does not end in `.json`
- **THEN** the application SHALL show a clear error
- **AND** the application SHALL leave the editor content unchanged
- **AND** the application SHALL not send an upload request

#### Scenario: Failed file read

- **WHEN** an uploader selects a `.json` file and the browser fails to read it
- **THEN** the application SHALL show a clear error
- **AND** the application SHALL leave the editor content unchanged

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

### Requirement: Authenticated Core forwarding

The upload route SHALL forward a valid snapshot to Core’s existing `POST /sources` endpoint as a multipart JSON file using the access token from the HttpOnly BFF session cookie. It SHALL not accept a client-supplied Authorization header. When Core returns 401, it SHALL attempt exactly one refresh using the refresh cookie and retry the upload once if refresh succeeds.

#### Scenario: Successful upload

- **WHEN** an authenticated uploader submits a valid snapshot
- **THEN** the route SHALL send `nodika-snapshot.json` as multipart field `file` to `${NODIKA_CORE_URL}/sources`
- **AND** the route SHALL return Core’s source identifier and creation timestamp

#### Scenario: Expired access token

- **WHEN** Core rejects the cookie-held access token with 401 and the refresh cookie succeeds
- **THEN** the route SHALL rotate both session cookies
- **AND** SHALL retry the upload once with the refreshed access token

#### Scenario: Failed session refresh

- **WHEN** Core rejects the cookie-held access token with 401 and refresh fails
- **THEN** the route SHALL clear both session cookies
- **AND** SHALL return a safe 401 response

### Requirement: Server-only Core configuration

The upload route SHALL obtain the Core base URL from server-only `NODIKA_CORE_URL` configuration.

#### Scenario: Missing Core configuration

- **WHEN** `NODIKA_CORE_URL` is not configured
- **THEN** the route SHALL return a 503 response with a generic configuration error
- **AND** the response SHALL not include a stack trace or internal configuration value

### Requirement: Settings entry to snapshot upload

The settings Projects section SHALL navigate users to the existing localized `/upload` route for new snapshot uploads. Upload validation, BFF forwarding, activation of `activeProjectId`, and library refresh SHALL remain as specified for `/upload`; settings MUST NOT introduce a second upload implementation.

#### Scenario: Settings deep-link to upload

- **WHEN** an authenticated user opens `/upload` from the settings Projects upload control
- **THEN** the page SHALL show the existing snapshot JSON editor and upload controls
- **AND** a successful upload SHALL activate the project and refresh the Core-backed library as on a direct visit to `/upload`
