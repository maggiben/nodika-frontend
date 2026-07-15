## Why

Message flows currently duplicate title/body inside each graph node (or copy presets), so staff maintain the same WhatsApp text in two places. Flows should reuse messages already created under **Mensajes del equipo** and only decide order/branching with arrows.

## What Changes

- Flow nodes can (and in the editor primarily do) reference an existing catalog message via `catalogMessageId`.
- Outbound flow sends resolve live copy from the catalog when a node is linked; edges still decide which message comes next.
- Flow editor: add steps by picking from the team message catalog; connect them with arrows; keep order DnD / step numbers.
- Linked nodes show catalog title/body as read-through (edit text in Mensajes, not as a separate free-form flow draft).
- Blank/preset-only node creation is demoted: presets belong in catalog create; flows consume catalog rows.
- **BREAKING** for editors only: new primary path is catalog-backed nodes (existing inline-only flows keep working until resaved with links).

## Capabilities

### New Capabilities

- `staff-flow-catalog-reuse`: Flow steps reuse team catalog messages; arrows define sequence/branching.

### Modified Capabilities

- (none in `openspec/specs/` — prior flow work lives under changes; this introduces the reuse capability)

## Impact

- **nodika-core**: `MessageFlowNode` + upsert validation + `sendFlowNodeMessage` resolve catalog; optional `catalogMessageId` on outbound `StaffMessage`.
- **nodika-frontend**: flow editor catalog picker, parsers/types, i18n; BFF unchanged shape except node field.
- Depends on existing catalog list API; no new external services.
