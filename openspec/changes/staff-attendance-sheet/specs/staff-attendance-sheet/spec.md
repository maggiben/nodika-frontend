## ADDED Requirements

### Requirement: Attendance sheet for a site lead’s team

The application SHALL provide an authenticated, localized attendance sheet for a single Staff lead (`contactId`) that lists that lead’s org-chart reports and lets the operator record standard daily attendance marks.

#### Scenario: Open sheet from org chart

- **WHEN** an authenticated user opens the attendance route for a lead (including via a control on that lead’s org-chart editor)
- **THEN** the app SHALL show an attendance sheet scoped to that lead
- **AND** SHALL list the lead’s current org-chart reports as grid rows

#### Scenario: Unauthenticated access

- **WHEN** an unauthenticated user opens the attendance route
- **THEN** the app SHALL redirect them to the localized login page

#### Scenario: Empty team

- **WHEN** the lead has zero org-chart reports
- **THEN** the sheet SHALL explain that reports must be added in the org chart before marking attendance
- **AND** SHALL NOT imply that marks were saved for people who do not exist

### Requirement: Standard attendance marks on a monthly Data Grid

The attendance sheet SHALL use MUI X Data Grid with one row per person and one column per calendar day of the selected month, and SHALL support the standard marks: full day, half day, absent, and justified (plus unset).

#### Scenario: Select a month

- **WHEN** the operator selects a year-month
- **THEN** the grid SHALL show day columns for every calendar day in that month
- **AND** SHALL load any previously saved marks for those dates from Core through the messaging BFF without clearing other months’ history

#### Scenario: Record and change a mark

- **WHEN** the operator sets a cell to full day, half day, absent, or justified
- **THEN** the app SHALL persist that mark for the lead, report id, and date to Core through the messaging BFF
- **WHEN** the operator clears a cell
- **THEN** the app SHALL remove that day’s mark in Core while leaving all other history intact

#### Scenario: History survives month changes

- **WHEN** the operator records marks in month A, then views month B, then returns to month A
- **THEN** month A’s marks SHALL still be present from Core

### Requirement: Employee search and attendance tallies

The attendance sheet SHALL let the operator search/filter people by name and SHALL show tallies of full days, half days, absences, and justified absences for the selected month over the visible (filtered) rows.

#### Scenario: Search by name

- **WHEN** the operator types a name query in the sheet search control
- **THEN** the grid SHALL show only reports whose names match that query (case-insensitive)
- **AND** the tallies SHALL recompute for the filtered set

#### Scenario: Count marks for one person

- **WHEN** the filtered set contains a single report with marks in the selected month
- **THEN** the tallies SHALL equal that person’s full-day, half-day, absent, and justified counts for that month

### Requirement: Monthly CSV export with intact history

The attendance sheet SHALL let the operator export a CSV report for the selected lead and month without deleting any stored attendance history.

#### Scenario: Export current month

- **WHEN** the operator activates monthly export for the visible month
- **THEN** the app SHALL download a CSV that includes each relevant person and their day marks for that month
- **AND** the Core-stored attendance history SHALL remain unchanged after the export

#### Scenario: People who left mid-month

- **WHEN** a report id has marks in the selected month but is no longer on the lead’s org chart
- **THEN** the export SHALL still include that report id’s marks for the month
- **AND** SHALL label the person from the chart when available, otherwise with a clear removed/unknown placeholder

### Requirement: Core is the attendance source of truth

The attendance sheet SHALL NOT use browser `localStorage` as the source of truth for marks. Marks SHALL be loaded from and saved to Core through the authenticated messaging BFF.

#### Scenario: Persist across sessions

- **WHEN** the operator saves marks for a lead and later opens the sheet on another browser session with the same account
- **THEN** the sheet SHALL show those marks loaded from Core
