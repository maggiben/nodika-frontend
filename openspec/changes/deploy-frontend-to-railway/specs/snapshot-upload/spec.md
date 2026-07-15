## MODIFIED Requirements

### Requirement: Server-only Core configuration

The upload route SHALL obtain the Core base URL from server-only `NODIKA_CORE_URL` configuration in every deployed environment.

#### Scenario: Forwarding from Railway production

- **WHEN** the Railway frontend receives a valid snapshot upload
- **THEN** it SHALL forward the snapshot to the Railway Core service using `NODIKA_CORE_URL`
- **AND** Core SHALL remain responsible for persisting the source document to MongoDB

#### Scenario: Missing Core configuration

- **WHEN** `NODIKA_CORE_URL` is not configured
- **THEN** the route SHALL return a 503 response with a generic configuration error
- **AND** the response SHALL not include a stack trace or internal configuration value
