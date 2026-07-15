## ADDED Requirements

### Requirement: Reorder flow messages with drag and drop

The flow editor SHALL let the operator reorder message nodes via drag and drop. After a drop, sequence numbers SHALL update automatically and the linear chain (start + consecutive edges) SHALL match the new order.

#### Scenario: Drag reorder renumbers

- **WHEN** the operator drags message 3 above message 1 and drops it
- **THEN** badges SHALL become 1, 2, 3 in the new order
- **AND** the first node SHALL become the start node
- **AND** consecutive edges SHALL connect 1→2→3

### Requirement: Per-contact message numbers on send

When Core sends a flow WhatsApp to a staff contact, the outbound title SHALL include a 1-based step index for that contact’s active run, restarting at 1 for each new run/contact.

#### Scenario: Second lead restarts at 1

- **WHEN** lead A receives message 2 of a flow and lead B starts the same flow
- **THEN** lead B’s first outbound SHALL be numbered as step 1 (not continue from A’s counter)
