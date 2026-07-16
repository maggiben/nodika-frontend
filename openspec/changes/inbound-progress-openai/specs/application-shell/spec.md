## ADDED Requirements

### Requirement: Navbar obra progress indicator

The shared application navbar SHALL include an obra progress indicator adjacent to the project selector when live progress is available for the selected project.

#### Scenario: Progress beside project selector

- **WHEN** the local project library has a selected project and live overall progress is available
- **THEN** the navbar SHALL render the progress indicator in the same central control group as the project selector
- **AND** the indicator SHALL remain visible across localized routes that use the shared navbar
