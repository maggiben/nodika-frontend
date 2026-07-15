## ADDED Requirements

### Requirement: Flow steps reuse catalog messages

The system SHALL allow each message-flow node to reference an active team catalog message by id so that WhatsApp copy is reused from Mensajes del equipo rather than authored only inside the flow.

#### Scenario: Add step from catalog in editor

- **WHEN** staff opens the flow editor and chooses an active catalog message
- **THEN** a node is added with that catalog id and the catalog title/body shown on the canvas

#### Scenario: Arrows define order

- **WHEN** staff connects two catalog-backed nodes with an edge
- **THEN** the flow uses that edge to decide which message is sent after a reply (existing match types)

#### Scenario: Send uses live catalog copy

- **WHEN** Core sends a flow node that has an active `catalogMessageId`
- **THEN** the outbound title/body SHALL come from the catalog message (and MAY still apply per-contact `step/total` prefixing)

#### Scenario: Missing catalog at send

- **WHEN** Core would send a node whose `catalogMessageId` is missing or inactive
- **THEN** the send for that step fails and the flow run is marked failed rather than inventing new copy

#### Scenario: Legacy inline nodes

- **WHEN** a saved node has no `catalogMessageId`
- **THEN** Core SHALL keep sending that node’s stored title/body (backward compatible)
