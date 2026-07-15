## Why

Message ordering lives in Mensajes del equipo (per site lead). The separate Flujos graph editor is obsolete and confusing.

## What Changes

- Remove the Flujos page, editor widget, BFF `/api/messaging/flows*`, and frontend flow helpers/tests/i18n.
- Remove the “Abrir flujos de mensajes” card from the staff messaging screen.
- Remove nodika-core MessageFlow / MessageFlowRun API, schema, match/validate helpers, and flow advance-after-reply (catalog order + advance remains).

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- (removal of obsolete flow UI/API; no main `openspec/specs/` capability to keep for flows)

## Impact

- nodika-frontend + nodika-core. Catalog Mensajes del equipo ordering/sequencing is unchanged.
