## Context

Catalog per-lead `sortOrder` + reply advance replaced the graph editor for team WhatsApp chaining.

## Decisions

1. Delete frontend flow surfaces completely (page, component, lib, BFF, copy).
2. Delete Core MessageFlow / MessageFlowRun engine and `/messaging/flows*` endpoints; keep catalog `sortOrder` + `advanceCatalogAfterReply`.
3. No Mongo migration — orphaned flow collections are ignored.
4. No redirect from `/staff/flows` — Next 404 is acceptable.

## Risks

Low: anyone with a saved flow loses that UI/API; product already moved to Mensajes.
