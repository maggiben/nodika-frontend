## ADDED Requirements

### Requirement: Catalog messages Data Grid

The Staff page SHALL show a sortable MUI X Data Grid of catalog messages with title and a truncated body preview, in addition to the employee roster and template ayuda-memoria.

#### Scenario: Viewing the catalog

- **WHEN** an authenticated user opens the Staff page
- **THEN** the page SHALL list catalog messages with title and truncated body
- **AND** the full body SHALL remain available via tooltip or equivalent without truncating stored data

#### Scenario: Creating a catalog message

- **WHEN** the user saves a new catalog message with title and body
- **THEN** the BFF SHALL persist the full title and body through Core
- **AND** the grid SHALL show the new row with a truncated body preview when the body is long

#### Scenario: Assigning a message to an employee

- **WHEN** the user assigns a catalog message to a staff employee
- **THEN** the BFF SHALL persist that association
- **AND** the catalog grid SHALL show the assigned employee

#### Scenario: Sending an assigned catalog message

- **WHEN** the user sends a catalog message that has an assigned employee
- **THEN** the BFF SHALL request Core to send the full message body to that employee
- **AND** Core SHALL persist an outbound delivery record with full text and precise `sentAt` for later AI analysis

### Requirement: Precise response metrics for AI analysis

Core SHALL persist staff replies linked to the outbound delivery with full reply text, reply timestamp, response latency in milliseconds, and a semaphore status derived from that latency.

#### Scenario: Staff replies to a catalog message

- **WHEN** an inbound WhatsApp reply is recorded for a phone with a recent unmatched outbound delivery
- **THEN** Core SHALL attach the full reply body and `repliedAt`
- **AND** SHALL store `responseLatencyMs` as the difference between `repliedAt` and outbound `sentAt`
- **AND** SHALL store response status green (≤2 days), yellow (>2 and ≤5 days), or red (>5 days)

#### Scenario: UI shows delivery semaphore

- **WHEN** a catalog or history row has stored response metrics
- **THEN** the Staff page SHALL show the green / yellow / red status with an accessible label
