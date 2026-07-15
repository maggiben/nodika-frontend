## ADDED Requirements

### Requirement: Message flow graph editor

The Staff area SHALL provide an authenticated UI to create and edit a message flow as a visual graph of message nodes connected by directed edges.

#### Scenario: Create nodes and edges

- **WHEN** an authenticated user opens the flow editor and adds two message nodes with title and body
- **THEN** the UI SHALL allow connecting them with a directed edge
- **AND** SHALL require a reply match rule on that edge (`equals` or `contains` plus a non-empty value)

#### Scenario: Persist graph layout

- **WHEN** the user saves the flow after moving nodes on the canvas
- **THEN** the BFF SHALL persist node content, edge rules, start node, and node positions
- **AND** a later reload SHALL restore that graph

#### Scenario: Unauthenticated access

- **WHEN** an unauthenticated user opens the flow editor route
- **THEN** the app SHALL redirect them to the localized login page

### Requirement: Start a flow for a staff contact

The application SHALL let an operator start a saved active flow for a selected staff roster contact.

#### Scenario: Start sends the start node

- **WHEN** the user starts a flow for a contact and Core/Evolution are available
- **THEN** the system SHALL send the start node’s message to that contact’s WhatsApp
- **AND** SHALL place the run in a waiting-for-reply state for that contact

#### Scenario: Reject second active run

- **WHEN** a contact already has an awaiting-reply flow run and the user tries to start another
- **THEN** the API SHALL reject the start without sending a duplicate conversation in v1

### Requirement: Reply-driven progression

After an inbound WhatsApp reply is matched to the open outbound of an active flow run, the system SHALL evaluate edges from the current node and may send the next node automatically.

#### Scenario: Matching edge sends next message

- **WHEN** the contact’s reply matches an outgoing edge’s rule from the current node
- **THEN** Core SHALL send the target node’s message to the same contact
- **AND** SHALL update the run’s current node to that target
- **AND** SHALL leave the run awaiting reply unless the target has no outgoing edges (then completed)

#### Scenario: No matching edge

- **WHEN** the reply does not match any outgoing edge from the current node
- **THEN** the system SHALL NOT send another flow message
- **AND** SHALL keep the run awaiting reply (or an explicit failed/unmatched state documented by Core)

#### Scenario: Frontend does not handle webhooks

- **WHEN** Evolution delivers an inbound message
- **THEN** progression SHALL be handled by Core
- **AND** the frontend SHALL only reflect run/catalog status via existing or new read APIs (no browser webhook)
