## Why

Staff need to order messages inside **Mensajes del equipo**, with numbers that restart per site lead—not a separate Flujos graph. The graph editor missed that product intent.

## What Changes

- Catalog rows gain a per-assignee `sortOrder` (1…n within each `assignedContactId`).
- Mensajes UI: group by lead, show order badges, drag-and-drop within a lead to renumber.
- Reassign recalculates order buckets.
- When a lead replies to catalog message N, Core auto-sends catalog message N+1 for the same assignee (linear sequence from Mensajes order)—no Flujos required.
- WhatsApp title can show `n/total · title` using that lead’s catalog count.

## Capabilities

### New Capabilities

- `staff-catalog-order`: Per-lead sort order, DnD, and reply-driven next catalog send.

### Modified Capabilities

- (none in main specs)

## Impact

- nodika-core catalog schema/API + inbound reply
- nodika-frontend `staff-catalog-panel` + BFF reorder
- Flujos remain available but are not required for ordered team messaging
