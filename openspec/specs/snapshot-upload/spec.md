# snapshot-upload Specification

## Purpose

TBD - created by archiving change upload-nodika-snapshot. Update Purpose after archive.

## Requirements

### Requirement: JSON snapshot editor

The application SHALL provide an editor for entering `nodika-snapshot-v1` JSON with JSON syntax highlighting.

#### Scenario: Editing a snapshot

- **WHEN** an uploader opens the home page
- **THEN** the application SHALL show a JSON-highlighted editor with a snapshot template
- **AND** the uploader SHALL be able to replace its content

### Requirement: Snapshot structure validation

The application SHALL reject syntactically invalid or structurally inconsistent snapshots before upload.

#### Scenario: Invalid JSON syntax

- **WHEN** the editor contains invalid JSON
- **THEN** the application SHALL display a syntax error
- **AND** the application SHALL not send an upload request

#### Scenario: Inconsistent snapshot dates

- **WHEN** a snapshot task starts after it ends
- **THEN** the application SHALL display a task-specific validation error
- **AND** the application SHALL not send an upload request

#### Scenario: Valid snapshot structure

- **WHEN** the editor contains a valid `nodika-snapshot-v1` document and the browser has an authenticated BFF session
- **THEN** the application SHALL accept the required metadata and task fields
- **AND** the application SHALL allow submission without requesting or accepting a bearer token field

### Requirement: Server-side snapshot validation

The upload route SHALL validate the snapshot JSON and semantic constraints independently of client-side validation.

#### Scenario: Bypassed client validation

- **WHEN** a request sends an invalid snapshot directly to `POST /api/snapshots`
- **THEN** the route SHALL return a 400 response with safe validation errors
- **AND** the route SHALL not forward the document to Core

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
