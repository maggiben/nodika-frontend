## ADDED Requirements

### Requirement: Settings entry to snapshot upload

The settings Projects section SHALL navigate users to the existing localized `/upload` route for new snapshot uploads. Upload validation, BFF forwarding, activation of `activeProjectId`, and library refresh SHALL remain as specified for `/upload`; settings MUST NOT introduce a second upload implementation.

#### Scenario: Settings deep-link to upload

- **WHEN** an authenticated user opens `/upload` from the settings Projects upload control
- **THEN** the page SHALL show the existing snapshot JSON editor and upload controls
- **AND** a successful upload SHALL activate the project and refresh the Core-backed library as on a direct visit to `/upload`
