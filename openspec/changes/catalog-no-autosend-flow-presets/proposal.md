## Why

Creating or assigning a “Mensajes del equipo” row currently auto-sends WhatsApp immediately. Operators expect presets (e.g. asistencia) to draft and wait for an explicit Enviar / flow start. Separately, they want to chain asks 1→2→3 with Unity-style arrows — which belongs in Flujos, seeded from the same presets.

## What Changes

- Core: stop auto-sending on catalog create and assign; keep explicit send + scheduled resend.
- Frontend: update success copy so create/assign no longer claim “enviado”.
- Flow editor: add “preset → new node” actions so operators can drop asistencia / performance / avance into the graph and connect with edges.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `staff-message-catalog`: create/assign persist only; send is explicit.
- `staff-message-flow`: editor can seed nodes from catalog presets.

## Impact

- nodika-core MessagingService create/assign
- staff-catalog-panel copy/tests
- staff-message-flow-editor + draft helpers
