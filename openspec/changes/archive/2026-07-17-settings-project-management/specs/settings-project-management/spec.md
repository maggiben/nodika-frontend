## ADDED Requirements

### Requirement: Projects section on settings

The authenticated settings page SHALL include a Projects section that lists Core-backed projects from the project library (name and project id) and provides actions to upload a snapshot and to delete a listed project. The section MUST reuse the existing localized `/upload` route for upload rather than embedding a second snapshot editor.

#### Scenario: Settings lists projects

- **WHEN** an authenticated user opens `/settings`
- **AND** the project library has loaded one or more projects from Core
- **THEN** the Projects section SHALL list those projects with a human-readable name and project id

#### Scenario: Empty project library

- **WHEN** an authenticated user opens `/settings`
- **AND** the project library has loaded successfully with no projects
- **THEN** the Projects section SHALL show an empty state
- **AND** SHALL still offer a control to upload a snapshot

#### Scenario: Upload from settings

- **WHEN** the user activates the upload control in the Projects section
- **THEN** the application SHALL navigate to the localized `/upload` route

### Requirement: Delete project from settings

The Projects section SHALL let the user delete a listed project after an explicit confirmation. On success, the application SHALL refresh the project library so the project no longer appears in settings or the navbar selector. Delete MUST NOT proceed without confirmation.

#### Scenario: Confirm and delete

- **WHEN** the user chooses delete for a listed project and confirms
- **AND** the BFF delete succeeds
- **THEN** the application SHALL refresh the project library
- **AND** that project SHALL no longer appear in the Projects section

#### Scenario: Cancel delete

- **WHEN** the user chooses delete for a listed project and cancels the confirmation
- **THEN** the application SHALL not call the delete BFF
- **AND** SHALL leave the project library unchanged

#### Scenario: Delete failure

- **WHEN** the user confirms delete and the BFF delete fails
- **THEN** the application SHALL show a safe error message
- **AND** SHALL keep the project listed until a later successful delete
