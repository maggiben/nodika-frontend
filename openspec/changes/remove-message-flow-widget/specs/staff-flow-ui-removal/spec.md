## ADDED Requirements

### Requirement: No message-flow editor in the frontend

The frontend SHALL NOT expose a message-flow graph editor, list, or BFF routes under `/api/messaging/flows`.

#### Scenario: Staff messaging screen

- **WHEN** a user opens the team messaging page
- **THEN** there is no control that links to a Flujos editor

#### Scenario: Flow routes removed

- **WHEN** a client requests `/api/messaging/flows` or `/[locale]/staff/flows`
- **THEN** those frontend routes do not exist (404)

### Requirement: No message-flow API in Core

nodika-core SHALL NOT expose `/messaging/flows` endpoints or persist MessageFlow / MessageFlowRun models in the application layer.

#### Scenario: Catalog sequencing remains

- **WHEN** a contact replies to a catalog message that has a next ordered message for the same lead
- **THEN** Core still advances via catalog order (not via a flow run)
