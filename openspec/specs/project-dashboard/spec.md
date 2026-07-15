# Project Dashboard

## Purpose

Visualize Nordika snapshot JSON on the landing page using progress labels, charts, and task grids.

## Requirements

### Requirement: Project status landing dashboard

The application SHALL use `/` as a project-status landing page that visualizes the latest locally available snapshot JSON with progress labels, at least one graph/visualization, and a task grid.

#### Scenario: Viewing a saved snapshot

- **WHEN** a user opens `/` and a snapshot JSON is available in local storage
- **THEN** the page SHALL show the project name and cycle summary
- **AND** SHALL show overall progress labeling
- **AND** SHALL show a graphical progress visualization
- **AND** SHALL show a grid/table of objective tasks with progress

#### Scenario: Missing snapshot

- **WHEN** a user opens `/` and no snapshot JSON is available
- **THEN** the page SHALL show an empty state explaining that an upload is required
- **AND** authenticated users SHALL be directed toward the upload entry in the account menu
