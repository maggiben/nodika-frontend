## ADDED Requirements

### Requirement: Upload updates project library

A successful snapshot upload SHALL upsert the submitted JSON into the local multi-project library and select that project for the dashboard.

#### Scenario: Successful authenticated upload

- **WHEN** an authenticated user successfully uploads a snapshot on `/upload`
- **THEN** the application SHALL persist the snapshot in the local project library
- **AND** SHALL select that project
- **AND** SHALL navigate to the home dashboard
