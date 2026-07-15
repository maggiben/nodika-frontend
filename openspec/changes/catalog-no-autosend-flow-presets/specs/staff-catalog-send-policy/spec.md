## MODIFIED Requirements

### Requirement: Catalog create and assign do not send WhatsApp

Creating or assigning a catalog message SHALL persist the row without sending WhatsApp. Sending SHALL require an explicit send action (or an existing scheduled job).

#### Scenario: Create with assignee

- **WHEN** an operator creates a catalog message with an assigned contact
- **THEN** the message SHALL be saved assigned to that contact
- **AND** SHALL NOT send WhatsApp during create

#### Scenario: Assign existing message

- **WHEN** an operator assigns a catalog message to a contact
- **THEN** the assignment SHALL be saved
- **AND** SHALL NOT send WhatsApp during assign

#### Scenario: Explicit send still works

- **WHEN** an operator uses Enviar on an assigned catalog message
- **THEN** Core SHALL send the message via Evolution as today

## ADDED Requirements

### Requirement: Seed flow nodes from catalog presets

The flow editor SHALL let the operator add a new message node prefilled from a catalog preset (attendance, performance, work progress), using the currently selected start-contact’s org chart when available.

#### Scenario: Add preset node

- **WHEN** the operator chooses a preset while editing a flow
- **THEN** a new node SHALL appear with that preset’s title and body
- **AND** the operator SHALL be able to connect it with edges like any other node
