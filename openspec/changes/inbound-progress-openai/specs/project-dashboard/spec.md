## MODIFIED Requirements

### Requirement: Project status landing dashboard

The application SHALL use `/` as a project-status landing page that visualizes the selected locally stored snapshot JSON with progress labels, MUI X Charts visualizations, and MUI X Community Data Grid task tables. Objective and context task Data Grids SHALL support client-side column sorting and filtering. When live obra progress is available for the selected project, progress labels and charts SHALL incorporate that live data (including role breakdown when provided) without requiring another snapshot upload.

#### Scenario: Viewing a saved snapshot

- **WHEN** a user opens `/` and a selected snapshot JSON is available in the local project library
- **THEN** the page SHALL show the project name and cycle summary
- **AND** SHALL show overall progress labeling with an MUI X Charts gauge (or equivalent chart)
- **AND** SHALL show at least one MUI X Charts bar visualization for snapshot breakdowns
- **AND** SHALL show objective tasks in an MUI X Community Data Grid with progress

#### Scenario: Sorting and filtering tasks

- **WHEN** a user views a task Data Grid with one or more rows
- **THEN** they SHALL be able to sort columns from the grid headers
- **AND** they SHALL be able to filter rows using the grid's filter controls (column filters and/or quick filter)

#### Scenario: Missing snapshot

- **WHEN** a user opens `/` and no snapshot JSON is available in the local library
- **THEN** the page SHALL show an empty state explaining that an upload is required
- **AND** authenticated users SHALL be directed toward the upload entry in the account menu

#### Scenario: Honoring the navbar selection

- **WHEN** the user changes the active project in the navbar selector
- **THEN** the dashboard SHALL update to that project's visualization without requiring another upload

#### Scenario: Refreshing from live inbound progress

- **WHEN** live obra progress becomes available for the selected project
- **THEN** the dashboard progress gauge and related progress charts SHALL update to reflect that live progress
- **AND** objective-task progress cells SHALL prefer live percents for matching task ids when present
