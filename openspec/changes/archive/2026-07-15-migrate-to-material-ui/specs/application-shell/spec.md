## MODIFIED Requirements

### Requirement: Global typography and theme tokens

The application SHALL load the Geist Sans and Geist Mono font variables and provide global typography and light/dark theme behavior through Material UI.

#### Scenario: Applying the document shell

- **WHEN** the root layout renders
- **THEN** the HTML element SHALL include both Geist font variable classes
- **AND** Material UI SHALL provide the active palette and baseline styles
