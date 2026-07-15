## Context

The Next.js frontend proxies validated snapshot uploads through `POST /api/snapshots` to Core’s authenticated `POST /sources` endpoint. Core is already running in the Railway production project and MongoDB has a persistent mounted volume. Direct browser-to-Core calls are unsuitable because Core has no CORS configuration; the server-side proxy keeps Core’s URL server-only.

## Goals / Non-Goals

**Goals:**

- Deploy the frontend as an independent Railway service.
- Configure the exact deployed Core URL through a server-only variable.
- Verify the deployed frontend is reachable and that Core remains connected to its persistent MongoDB service.

**Non-Goals:**

- Adding client-side MongoDB access.
- Changing Core’s authentication contract, CORS policy, or generic source schema.
- Exposing a Core JWT in Railway frontend variables or the browser.

## Decisions

### Railway service configuration

Railway Railpack builds the Next.js project and runs `npm run start`. A root health check uses `/`, which requires no Core credential or persistence operation.

### Core-to-Mongo ownership

The frontend never receives a MongoDB URI. It forwards a validated JSON file to Core, and Core persists the document through its configured Mongo connection. The frontend has only `NODIKA_CORE_URL`, set to Core’s Railway public domain.

### Deployment verification

Verify the frontend deployment returns a successful response at its Railway domain. Confirm Core and Mongo deployment status through Railway. An authenticated source-upload persistence probe is not automated because the existing Core endpoint requires a valid `source_writer` JWT; no token is available or stored in the frontend deployment.

## Risks / Trade-offs

- [Core public URL is unavailable] → The frontend returns a safe upstream failure without exposing configuration details.
- [Core lacks Mongo configuration] → Core returns its existing 503; Railway service and volume status are inspected before release.
- [Manual JWT upload cannot be probed automatically] → A privileged authorized user must perform the final source-record persistence check.
