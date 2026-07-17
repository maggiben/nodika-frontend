## ADDED Requirements

### Requirement: Core-backed project library

The application SHALL load uploaded Nodika snapshot projects from Core (via the authenticated BFF) and SHALL use the account `activeProjectId` as the selected project for the dashboard and messaging scope. The application MUST NOT persist snapshot JSON in browser `localStorage` as the project library.

#### Scenario: Loading projects after sign-in

- **WHEN** an authenticated user opens a page that shows the project selector or dashboard
- **AND** Core has one or more SourceOfTruth documents with a `projectId`
- **THEN** the application SHALL list those projects from the BFF snapshot list
- **AND** SHALL treat `activeProjectId` from account settings as the selected project when it matches a listed project

#### Scenario: Selecting a project

- **WHEN** a user chooses a project from the navbar selector
- **THEN** the application SHALL PATCH account settings with that `activeProjectId`
- **AND** the home dashboard SHALL visualize that project's snapshot content from Core

#### Scenario: No local snapshot cache

- **WHEN** the user clears browser storage or opens another browser
- **AND** Core still has the uploaded sources
- **THEN** the application SHALL still list and visualize those projects after loading from the BFF
