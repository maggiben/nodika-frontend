## ADDED Requirements

### Requirement: Per-lead catalog order

The system SHALL store and display a 1-based order for each catalog message assigned to a site lead, restarting at 1 for every distinct assignee.

#### Scenario: Drag reorder within a lead

- **WHEN** staff drag-and-drop messages inside one lead’s group in Mensajes del equipo
- **THEN** each message shows the updated order number and the new order is persisted

#### Scenario: Numbers restart per lead

- **WHEN** message A is assigned to lead X as order 2 and message B to lead Y as order 1
- **THEN** lead Y’s badge shows 1 independently of lead X’s sequence

#### Scenario: Reply sends next ordered message

- **WHEN** a lead replies to an open outbound catalog message that is order N for that lead
- **AND** there is an active catalog message assigned to the same lead with order N+1
- **THEN** the system sends that next catalog message without using Flujos
