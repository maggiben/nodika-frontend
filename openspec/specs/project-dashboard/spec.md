# Project Dashboard

## Purpose

Visualize Nodika snapshot JSON on the landing page using progress labels, charts, and task grids.
## Requirements
### Requirement: Project status landing dashboard

The application SHALL use `/` as a project-status landing page that visualizes the selected project's snapshot JSON from Core (via the authenticated BFF) with progress labels, MUI X Charts visualizations, and MUI X Community Data Grid task tables. Objective and context task Data Grids SHALL support client-side column sorting and filtering. While the initial project library is loading from Core, the page SHALL show a loading indicator and SHALL NOT show the empty upload state. The empty upload state SHALL appear only when Core successfully returns no selectable snapshot sources.

#### Scenario: Viewing a saved snapshot

- **WHEN** a user opens `/` and a selected snapshot JSON is available from Core for the active project
- **THEN** the page SHALL show the project name and cycle summary
- **AND** SHALL show overall progress labeling with an MUI X Charts gauge (or equivalent chart)
- **AND** SHALL show at least one MUI X Charts bar visualization for snapshot breakdowns
- **AND** SHALL show objective tasks in an MUI X Community Data Grid with progress

#### Scenario: Sorting and filtering tasks

- **WHEN** a user views a task Data Grid with one or more rows
- **THEN** they SHALL be able to sort columns from the grid headers
- **AND** they SHALL be able to filter rows using the grid's filter controls (column filters and/or quick filter)

#### Scenario: Loading project library

- **WHEN** a user opens `/` and the project library has not finished loading from Core
- **THEN** the page SHALL show a loading indicator
- **AND** SHALL NOT show the empty upload state

#### Scenario: Missing snapshot

- **WHEN** a user opens `/` and Core successfully returns no snapshot sources for the account
- **THEN** the page SHALL show an empty state explaining that an upload is required
- **AND** authenticated users SHALL be directed toward the upload entry in the account menu

#### Scenario: Library request failed

- **WHEN** a user opens `/` and the project library request to Core does not succeed
- **THEN** the page SHALL NOT show the empty upload state

#### Scenario: Honoring the navbar selection

- **WHEN** the user changes the active project in the navbar selector
- **THEN** the dashboard SHALL update to that project's visualization without requiring another upload

