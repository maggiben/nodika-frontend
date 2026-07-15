## ADDED Requirements

### Requirement: Railway frontend service

The application SHALL deploy as an independent Railway service using its production build and start commands.

#### Scenario: Deploying the frontend

- **WHEN** Railway deploys the frontend service
- **THEN** it SHALL build the Next.js application
- **AND** it SHALL start the production server using `npm run start`

### Requirement: Production health check

The deployed frontend SHALL provide a publicly reachable health check through the root route.

#### Scenario: Requesting the Railway domain

- **WHEN** a user requests the frontend’s Railway public domain
- **THEN** the application SHALL return a successful response from `/`

### Requirement: Server-only Core configuration

The Railway frontend service SHALL set `NODIKA_CORE_URL` to the deployed Core service without exposing it to browser code.

#### Scenario: Forwarding an upload in production

- **WHEN** the frontend receives a valid snapshot upload
- **THEN** it SHALL resolve Core from server-only `NODIKA_CORE_URL`
- **AND** it SHALL not return the configured URL or any MongoDB credentials
