## Context

Flows and the team message catalog are separate today: catalog rows are `title`/`body` (+ assignee), flow nodes store their own `title`/`body`. Staff expect one source of truth in Mensajes and graph arrows only for “what comes before what.”

## Goals / Non-Goals

**Goals:**

- Link flow nodes to active catalog messages.
- Resolve send text from catalog at send time (with denormalized title/body cache on the node for display/offline graph).
- Keep edges (`any` / equals / contains) as the ordering and branching mechanism; keep order list DnD + `n/total` labels.
- Editor UX: pick from catalog → drop on canvas → connect with arrows.

**Non-Goals:**

- Auto-create catalog rows from the flow editor.
- Branching UI redesign beyond existing Connect + edge editors.
- Syncing catalog soft-delete into auto-rewiring of saved flows (send fails clearly if linked row is inactive/missing).
- Changing one-shot catalog assign/send outside flows.

## Decisions

1. **Optional `catalogMessageId` on `MessageFlowNode`**  
   String Core ObjectId. When set, send prefers active catalog `title`/`body`. When unset, keep legacy inline fields (backward compatible).

2. **Denormalize title/body on upsert**  
   On create/update flow, if `catalogMessageId` is present, Core copies current catalog title/body onto the node so the graph stays readable and validators stay simple. Editor may also send the copied fields from the client.

3. **Outbound tagging**  
   When sending a linked node, set `StaffMessage.catalogMessageId` in addition to existing `flowId` / `flowRunId` / `flowNodeId`.

4. **Editor source of truth**  
   Primary “Add” = select catalog message(s). Remove reliance on blank placeholder nodes and flow-preset injection for new steps. Connected arrows (and order DnD) define sequence.

5. **Same catalog row in multiple flows**  
   Allowed. Same row twice in one flow: allowed but discouraged in UI (show warning), not blocked by Core.

6. **Inactive/missing catalog at send**  
   Fail that step (run → failed) with a clear log/error rather than falling back to stale body unless `catalogMessageId` is absent.

## Risks / Trade-offs

| Risk                                       | Mitigation                                                                            |
| ------------------------------------------ | ------------------------------------------------------------------------------------- |
| Stale denormalized copy after catalog edit | Resolve on send from catalog                                                          |
| Orphan links after soft-delete             | Validate on upsert; fail send if inactive                                             |
| Larger upsert payload mistakes             | Zod/class-validator optional ObjectId; frontend validates against loaded catalog list |

## Migration

- Existing flows without `catalogMessageId` keep working.
- Staff can re-link nodes later by editing the flow and picking catalog rows.

## Open Questions

- None blocking: start with single-select add-from-catalog; multi-add can be follow-up.
