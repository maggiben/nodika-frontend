## ADDED Requirements

### Requirement: Live obra progress BFF proxy

The application SHALL expose an authenticated BFF route that proxies obra progress for a project id from Core messaging progress to the browser session, without exposing LLM credentials to the client. Progress data SHALL reflect Core’s dedicated parsed-progress collection aggregation when available.

#### Scenario: Authenticated progress fetch

- **WHEN** a signed-in user requests the BFF progress route with a `projectId` query parameter
- **THEN** the BFF SHALL forward the request to Core with the session access token
- **AND** SHALL return Core’s progress payload (overall percent, by-role breakdown, and reports) on success
- **AND** SHALL NOT call OpenAI or Anthropic from the frontend process

#### Scenario: Unauthenticated progress fetch

- **WHEN** an unauthenticated user requests the BFF progress route
- **THEN** the response SHALL be 401

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

### Requirement: Dashboard comparison from parsed progress

The project-status landing dashboard SHALL compare snapshot baseline progress to current progress derived from Core’s parsed-progress aggregation, and SHALL present baseline, current, and delta values in the stats area.

#### Scenario: Overall baseline current and delta

- **WHEN** a selected snapshot is available
- **AND** live progress provides a usable overall percent
- **THEN** the dashboard overall stats SHALL show the snapshot baseline overall percent
- **AND** SHALL show the live current overall percent
- **AND** SHALL show the numeric delta (current minus baseline)

#### Scenario: Per-task comparison when report matches

- **WHEN** live progress reports include a `taskId` matching an objective task in the selected snapshot
- **THEN** the dashboard SHALL show that task’s baseline from snapshot `avance_base`
- **AND** SHALL show the live current percent
- **AND** SHALL show the delta between them

#### Scenario: Snapshot fallback without fabricated delta

- **WHEN** no live progress is available for the selected project
- **THEN** the dashboard SHALL visualize snapshot baseline progress as today
- **AND** SHALL NOT invent a current percent or delta from incomplete data

### Requirement: Role breakdown chart from live progress

The project-status dashboard SHALL update its role progress visualization when live obra progress includes a by-role breakdown.

#### Scenario: Role breakdown chart

- **WHEN** live progress includes a by-role breakdown with at least one role percent
- **THEN** the dashboard SHALL show a chart or labeled breakdown for those roles
- **AND** the visualization SHALL update when the selected project’s live progress changes
