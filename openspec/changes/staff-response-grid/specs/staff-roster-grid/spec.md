## ADDED Requirements

### Requirement: Sortable staff roster Data Grid

The Staff page SHALL present active staff messaging employees in a sortable MUI X Data Grid (community) as the primary surface.

#### Scenario: Viewing the roster

- **WHEN** an authenticated user opens `/[locale]/staff`
- **THEN** the page SHALL show a Data Grid of staff employees with columns for name/label, phone, message types, last sent timestamp, last received timestamp, response status, and actions
- **AND** the user SHALL be able to sort by those columns and filter with the grid quick filter when the toolbar is shown

#### Scenario: Response status icons

- **WHEN** a roster row has a last sent timestamp and a last received timestamp on or after that send within two days
- **THEN** the row SHALL show a green response status with an accessible label
- **WHEN** a roster row was last sent more than two days and at most five days ago with no later receive
- **THEN** the row SHALL show a yellow response status with an accessible label
- **WHEN** a roster row was last sent more than five days ago with no later receive
- **THEN** the row SHALL show a red response status with an accessible label
- **WHEN** a roster row has never been sent a message
- **THEN** the row SHALL show a neutral status without implying success or failure

#### Scenario: Add a staff employee

- **WHEN** the user submits a new label and WhatsApp phone from the Staff page
- **THEN** the BFF SHALL create (or activate) a staff contact
- **AND** the grid SHALL include the employee after a successful save

#### Scenario: Remove a staff employee

- **WHEN** the user removes an employee from the roster
- **THEN** the BFF SHALL deactivate or delete that staff contact
- **AND** the grid SHALL stop listing the employee among active staff

#### Scenario: Test send from a grid row

- **WHEN** the user triggers test send on a roster row
- **THEN** the BFF SHALL request a Core test-send for that employee phone
- **AND** the UI SHALL report success or failure without leaving the page

#### Scenario: Re-reminder from a grid row

- **WHEN** the user confirms a re-reminder on a roster row that has a previous successful outbound message
- **THEN** the BFF SHALL request Core to resend that last outbound message
- **AND** the UI SHALL report success or failure
- **WHEN** the row has no previous successful outbound message
- **THEN** the re-reminder action SHALL be unavailable or SHALL explain that there is nothing to resend

#### Scenario: Degraded roster without message history

- **WHEN** the roster aggregate is unavailable but staff contacts can still be listed
- **THEN** the grid SHALL still list employees for add/remove
- **AND** SHALL show empty or neutral timestamps and status until history is available

### Requirement: Template editing secondary section

The Staff page SHALL keep message template editing with interpolation legend as a secondary section below the roster grid.

#### Scenario: Editing a template with interpolation

- **WHEN** a user edits a template body using tokens such as `{{duration}}` and `{{avance}}`
- **THEN** the page SHALL show a legend explaining each supported token
- **AND** the BFF SHALL persist the template through Core
