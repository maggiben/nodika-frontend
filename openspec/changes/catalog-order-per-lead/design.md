## Context

Flujos duplicated copy and confused the product. Ordering belongs on Mensajes cards, scoped by assignee (capataz / jefe de obra).

## Goals / Non-Goals

**Goals:** `sortOrder` per assigned lead; DnD + badges in Mensajes; reply to N sends N+1 for that lead.

**Non-Goals:** Removing Flujos; branching conditions in Mensajes; ordering across unassigned rows for send sequence.

## Decisions

1. `sortOrder: number` on `StaffCatalogMessage` (default 0). Meaningful only when `assignedContactId` is set.
2. `POST /messaging/catalog/reorder` body `{ contactId, orderedIds[] }` rewrite 1…n.
3. Assign/create-with-assignee appends at end (`max+1`). Unassign clears order to 0.
4. List returns sorted by assignee then `sortOrder`.
5. After catalog inbound reply (no flow run), if next assigned message exists with `sortOrder === current + 1`, send it automatically.
6. Unassigned messages: no sequence send; UI lane without DnD numbers (or “—”).

## Risks

- Auto-send on any reply may surprise if they expected keyword matching — match product ask (any reply advances like linear chain).
- Concurrent replies: only one open outbound per contact typically.

## Migration

Existing rows: backfill `sortOrder` by `createdAt` ascending within each assignee on first list/reorder, or one-time script in hydrate when listing.
