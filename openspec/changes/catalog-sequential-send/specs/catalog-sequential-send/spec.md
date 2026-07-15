## ADDED Requirements

### Requirement: One open catalog WhatsApp per lead

Core SHALL NOT send a second catalog WhatsApp to a contact while a prior catalog outbound for that contact is still awaiting a reply.

#### Scenario: Awaiting reply blocks another send

- **WHEN** contact C has a sent catalog message without `repliedAt`
- **AND** a client requests send for another catalog message assigned to C
- **THEN** Core rejects the send (conflict) and no WhatsApp is sent

### Requirement: Ordered steps require prior reply

Core SHALL only send catalog message order N for a contact when every active assigned message with lower `sortOrder` has a successful outbound that was replied to (or N is the first step / restart after all were replied).

#### Scenario: Reply advances to the next step

- **WHEN** contact C replies to catalog step N
- **AND** step N+1 exists for C
- **THEN** Core sends step N+1 and not any later step yet

#### Scenario: Scheduled job does not flood

- **WHEN** the scheduled catalog send runs for a contact with multiple assigned messages and no open awaiting reply
- **THEN** at most one catalog WhatsApp is sent for that contact (the next eligible step)
