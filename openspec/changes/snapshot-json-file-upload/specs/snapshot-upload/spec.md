## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: JSON snapshot editor

The application SHALL provide an editor for entering snapshot JSON with JSON syntax highlighting, and SHALL provide a control to load snapshot JSON from a local `.json` file into that editor.

#### Scenario: Editing a snapshot

- **WHEN** an uploader opens the upload page
- **THEN** the application SHALL show a JSON-highlighted editor with a snapshot template
- **AND** the uploader SHALL be able to replace its content by editing or by loading a local `.json` file

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
