## Why

The snapshot upload interface needs a public runtime and a configured Core connection. The existing Railway project already provides running Core and MongoDB services, but no frontend service currently exposes the Next.js application.

## What Changes

- Add Railway deployment configuration for the frontend service.
- Configure the deployed frontend’s server-only `NODIKA_CORE_URL` to the existing deployed Core service.
- Deploy the frontend to the existing Railway production project and generate a public domain.
- Verify the frontend health endpoint and Core’s source-storage flow, whose persistent MongoDB service is already provisioned.

## Capabilities

### New Capabilities

- `railway-deployment`: Public Railway deployment and operational configuration for Nordika Frontend.

### Modified Capabilities

- `snapshot-upload`: The server-side upload proxy will target the deployed Core endpoint in Railway production.

## Impact

- Adds Railway configuration and operational documentation.
- Creates a `nordika-frontend` Railway service in the existing `nordika-core` project.
- Sets a server-only frontend Core URL; Core continues to own MongoDB writes.
