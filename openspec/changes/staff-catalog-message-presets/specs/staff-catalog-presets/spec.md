## ADDED Requirements

### Requirement: Catalog message preset dropdown

The Staff catalog create form SHALL provide a dropdown of predefined message presets that fill the title and body fields before save.

#### Scenario: Choose attendance preset

- **WHEN** the user selects the attendance preset
- **THEN** the form SHALL fill title and body with the existing attendance draft semantics (full day / half day / absent per person)

#### Scenario: Choose performance preset

- **WHEN** the user selects the performance preset and an assignee has org-chart reports
- **THEN** the draft body SHALL list each person by their org-chart name and ask for a short performance update for the jornada/week
- **AND WHEN** there are no reports
- **THEN** the draft SHALL NOT invent placeholder names such as “Persona 1”
- **AND** SHALL include a short note to add people in the org chart

#### Scenario: Choose work-progress preset

- **WHEN** the user selects the work-progress preset
- **THEN** the draft SHALL ask the lead for tiempo de trabajo, porcentaje cumplido, duración, avance, and notas for the jornada
- **AND** the title and body fields SHALL remain editable after apply

#### Scenario: Assignee retained

- **WHEN** any preset is applied with an assignee already selected
- **THEN** the assignee selection SHALL remain unchanged
