## ADDED Requirements

### Requirement: Attendance catalog template draft

The application SHALL provide a localized attendance-report draft for a site lead that asks whether each person under them worked a full day, a half day, or was absent.

#### Scenario: Draft from org chart reports

- **WHEN** a lead has one or more people in the local org chart and the user requests the attendance template
- **THEN** the draft body SHALL greet the lead and list each report with role
- **AND** for each report SHALL include the choices full day, half day, and absent

#### Scenario: Draft without org chart people

- **WHEN** the lead has no local org-chart reports and the user requests the attendance template
- **THEN** the draft body SHALL still include a short placeholder list with the same attendance choices
- **AND** SHALL NOT invent or call a Core org-chart API

### Requirement: Prefill Mensajes del equipo create form

The Staff catalog create form SHALL let the user apply the attendance template into the title and body fields before saving.

#### Scenario: Apply template with selected assignee

- **WHEN** the user has selected an assignee on the create form and applies the attendance template
- **THEN** the title and body fields SHALL be filled from that assignee’s org chart (or placeholders)
- **AND** the selected assignee SHALL remain selected

#### Scenario: Save still uses existing catalog API

- **WHEN** the user saves after applying the template
- **THEN** the app SHALL create the catalog message through the existing catalog BFF
- **AND** SHALL NOT require a new Core endpoint
