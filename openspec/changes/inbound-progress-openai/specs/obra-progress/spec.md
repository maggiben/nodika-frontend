## ADDED Requirements

### Requirement: Live obra progress BFF proxy

The application SHALL expose an authenticated BFF route that proxies obra progress for a project id from Core messaging progress to the browser session, without exposing OpenAI credentials to the client.

#### Scenario: Authenticated progress fetch

- **WHEN** a signed-in user requests the BFF progress route with a `projectId` query parameter
- **THEN** the BFF SHALL forward the request to Core with the session access token
- **AND** SHALL return Core’s progress payload (overall percent, by-role breakdown, and reports) on success

#### Scenario: Unauthenticated progress fetch

- **WHEN** an unauthenticated user requests the BFF progress route
- **THEN** the response SHALL be 401
- **AND** SHALL NOT call OpenAI from the frontend process

### Requirement: Navbar obra progress chip

The shared application navbar SHALL show a compact progress indicator next to the project selector when a project is selected and live progress data includes an overall percent.

#### Scenario: Showing overall progress

- **WHEN** the user has at least one stored project selected
- **AND** the progress API returns an overall percent for that project
- **THEN** the navbar SHALL show a chip (or equivalent compact indicator) with that overall percent
- **AND** the indicator SHALL expose role-level percents (jefe de obra, operarios, jornaleros) in an accessible summary (for example tooltip or description text)

#### Scenario: No live progress yet

- **WHEN** a project is selected but the progress API returns no usable overall percent
- **THEN** the navbar SHALL omit the progress chip or show a non-misleading empty state
- **AND** SHALL NOT invent a percent from incomplete data

### Requirement: Dashboard charts refresh from live progress

The project-status dashboard SHALL update its progress visualizations when live obra progress is available for the selected project, overlaying inbound-derived percents on snapshot structure.

#### Scenario: Overlaying task progress

- **WHEN** live progress reports include a `taskId` that matches an objective task in the selected snapshot
- **THEN** the dashboard task progress display for that task SHALL use the live percent
- **AND** overall gauge / summary labeling SHALL use the live overall percent when present

#### Scenario: Role breakdown chart

- **WHEN** live progress includes a by-role breakdown with at least one role percent
- **THEN** the dashboard SHALL show a chart or labeled breakdown for those roles
- **AND** the visualization SHALL update when the selected project’s live progress changes

#### Scenario: Snapshot fallback

- **WHEN** no live progress is available for the selected project
- **THEN** the dashboard SHALL continue to visualize snapshot `avance_base` as today
