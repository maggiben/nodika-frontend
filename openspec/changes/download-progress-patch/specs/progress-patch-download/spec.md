## ADDED Requirements

### Requirement: Build patched snapshot JSON from live progress

The application SHALL produce a full snapshot JSON document for the selected project by copying the stored snapshot and updating each task’s `avance_base` when live obra progress reports include a matching `taskId`. When multiple reports share a `taskId`, the first report’s `percent` SHALL win. Tasks without a matching report SHALL keep their original `avance_base`.

#### Scenario: Overlay live percents onto snapshot tasks

- **WHEN** a selected snapshot contains tasks and live progress reports include percents for some of those task ids
- **THEN** the patched JSON SHALL set `avance_base` on matching tasks in `tareas_con_objetivo` and `tareas_contexto` to those percents
- **AND** tasks without matching reports SHALL retain their original `avance_base`

#### Scenario: No live reports available

- **WHEN** live progress is missing or has no task-scoped reports
- **THEN** the patched JSON SHALL equal the selected snapshot content (pretty-printed for download)

### Requirement: Download patched JSON from the client

The application SHALL offer a browser file download of the patched snapshot JSON with an `application/json` content type and a `.json` filename derived from the selected project when the user triggers Download patch.

#### Scenario: Successful download

- **WHEN** an authenticated user triggers Download patch and a selected project snapshot is available
- **THEN** the browser SHALL receive a downloadable JSON file containing the patched snapshot

#### Scenario: No selected project

- **WHEN** the user triggers Download patch and no selected snapshot JSON is available
- **THEN** the application SHALL not start a download
