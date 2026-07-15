## Why

Operators get flooded when several catalog WhatsApps for the same lead go out at once (especially the scheduled job). Concentration and reply quality suffer.

## What Changes

- Send at most one open catalog WhatsApp per lead at a time.
- Message N+1 only after message N has a recorded reply.
- Scheduled catalog send starts/resumes a single next step per lead instead of blasting the whole list.

## Capabilities

### New Capabilities

- `catalog-sequential-send`: one-at-a-time catalog WhatsApp sequencing per assigned contact.

### Modified Capabilities

- (none in main specs yet)

## Impact

- nodika-core messaging send/schedule/advance paths; existing catalog order + reply advance remain.
