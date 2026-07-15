## MODIFIED Requirements

### Requirement: Project status landing dashboard

The application SHALL use `/` as a project-status landing page that visualizes the selected locally stored snapshot JSON with progress labels, at least one graph/visualization, and a task grid.

#### Scenario: Viewing a saved snapshot

- **WHEN** a user opens `/` and a selected snapshot JSON is available in the local project library
- **THEN** the page SHALL show the project name and cycle summary
- **AND** SHALL show overall progress labeling
- **AND** SHALL show a graphical progress visualization
- **AND** SHALL show a grid/table of objective tasks with progress

#### Scenario: Missing snapshot

- **WHEN** a user opens `/` and no snapshot JSON is available in the local library
- **THEN** the page SHALL show an empty state explaining that an upload is required
- **AND** authenticated users SHALL be directed toward the upload entry in the account menu

#### Scenario: Honoring the navbar selection

- **WHEN** the user changes the active project in the navbar selector
- **THEN** the dashboard SHALL update to that project's visualization without requiring another upload
