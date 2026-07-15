## ADDED Requirements

### Requirement: MUI X Community visualization packages

The project SHALL depend on the community editions of MUI X Charts and Data Grid (`@mui/x-charts`, `@mui/x-data-grid`) for dashboard visualizations and tabular display.

#### Scenario: Inspecting package dependencies

- **WHEN** a contributor inspects `package.json` dependencies
- **THEN** `@mui/x-charts` and `@mui/x-data-grid` SHALL be listed
- **AND** Pro/Premium licensed MUI X packages SHALL not be required for the project dashboard
