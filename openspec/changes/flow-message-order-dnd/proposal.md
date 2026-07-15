## Why

Operators need to reorder flow messages visually and see a clear sequence number. Numbers must restart at 1 for each site lead (each FlowRun / contact), not continue across employees.

## What Changes

- Flow editor: reorderable message list (HTML5 drag-and-drop); dropping updates order badges, start node, and linear any-reply edges 1→2→3…
- Canvas nodes show the current sequence number.
- Core: when sending a flow WhatsApp, prefix the message with `n/total` based on that contact’s run step (resets per jefe).

## Capabilities

### Modified Capabilities

- `staff-message-flow`: ordered DnD editing + per-run step labels on send.

## Impact

- nodika-frontend flow editor + helpers/tests
- nodika-core `sendFlowNodeMessage` / start + advance step labeling
