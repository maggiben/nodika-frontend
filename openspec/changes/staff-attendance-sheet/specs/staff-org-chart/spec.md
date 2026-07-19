## ADDED Requirements

### Requirement: Navigate from org chart to attendance sheet

The org-chart editor SHALL provide a control that opens the attendance sheet for the same lead contact id.

#### Scenario: Open attendance from editor

- **WHEN** an authenticated user activates the attendance-sheet control on a lead’s org-chart editor
- **THEN** the app SHALL navigate to the localized attendance route scoped to that contact id
