## Why

Team catalog messages today are one-shot: send, wait for reply, stop. Operators need to chain asks (attendance → follow-up → escalation) and branch by what the jefe replies — like a Unity/Unreal node graph — without watching the inbox and sending the next message by hand.

## What Changes

- Add a **message flow** concept: a graph of catalog (or flow-local) message nodes connected by directed edges with reply-match conditions.
- Add a Staff UI **flow graph editor** (nodes + arrows) to define start node, edges, and match rules (`equals` / `contains`, case-insensitive).
- Persist flows through the messaging BFF; Core stores the graph and runtime state per contact.
- On inbound WhatsApp reply matched to an open outbound, Core evaluates outgoing edges from the current node and **automatically sends** the next matching message (or idles if none match).
- Non-goals for v1: full Unreal-grade editor, AI reply parsing, loops with unlimited fan-out, parallel threads per contact, or visual scripting beyond message nodes + conditional edges.

## Capabilities

### New Capabilities

- `staff-message-flow`: Graph-based staff WhatsApp conversation flows with editor UI, BFF persistence, and reply-driven progression (Core engine required).

### Modified Capabilities

- (none in `openspec/specs/` — catalog list remains; flows are additive)

## Impact

- Frontend: new Staff flow editor route/panel, BFF routes under `/api/messaging/flows*`, i18n
- Core (sibling `nodika-core`): flow schema, CRUD, runtime on inbound webhook, send-next wiring to Evolution
- Existing catalog messages may be referenced as node payloads or duplicated into flow nodes in v1
- Observability: need clear “current node / waiting for reply” state in UI after Core exposes it
