## ADDED Requirements

### Requirement: Tag attendance catalog presets

When the operator applies the attendance catalog message preset, the create form SHALL include the catalog tag `attendance` so Core can ingest WhatsApp replies into the attendance sheet.

#### Scenario: Apply attendance preset

- **WHEN** the user selects the attendance preset on the catalog create form
- **THEN** the draft tags SHALL include `attendance`

### Requirement: Planilla notes WhatsApp feed

The attendance sheet SHALL inform operators that replies to the team attendance WhatsApp message can update the planilla.

#### Scenario: Storage note mentions WhatsApp

- **WHEN** an authenticated user opens the attendance sheet
- **THEN** the UI SHALL mention that WhatsApp attendance replies can update saved marks
