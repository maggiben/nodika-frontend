## Context

Staff catalog messages are flat Core records sent via Evolution. Inbound replies hit Core webhooks and attach to the contact’s latest open outbound (`threadId`, `replyBody`) but never trigger another send. Frontend polls catalog status only. Operators want a visual graph (nodes + arrows) where reply text chooses the next outbound ask.

## Goals / Non-Goals

**Goals:**

- Editable flow graph in the Staff area: message nodes, directed edges, simple reply conditions.
- Persist graph + per-contact runtime (`currentNodeId`, `status`) in Core via BFF.
- On matching inbound reply, Core advances the active flow and sends the next node once.
- Start a flow for a selected staff contact (jefe) from the UI.

**Non-Goals:**

- Pixel-perfect Unreal editor (no blueprint variables, no delayed timers UI in v1).
- Parsing structured JSON replies; matching is string equality / substring.
- Multi-active flows for the same contact at once.
- Inventing unrelated infra (new databases beyond existing Mongo messaging store).

## Decisions

1. **Core owns progression**  
   Automatic next-send MUST run inside `recordInboundMessage` (or an immediate helper) after `replyBody` is stored. Frontend cannot receive Evolution webhooks.  
   *Alternative:* UI polling + manual send — rejected; fails the product ask.

2. **Flow document model (Mongo)**  
   ```
   Flow {
     _id, name, active,
     startNodeId,
     nodes: [{ id, title, body, position: {x,y} }],
     edges: [{ id, fromNodeId, toNodeId, match: { type: 'equals'|'contains', value: string } }]
   }
   FlowRun {
     _id, flowId, contactId,
     currentNodeId, status: 'idle'|'awaiting_reply'|'completed'|'failed',
     lastOutboundMessageId?, updatedAt
   }
   ```
   Frontend treats this as the BFF JSON contract; Core implements persistence.

3. **v1 editor stack**  
   Client canvas with absolute-positioned MUI Paper nodes + SVG/CSS edges (no new heavy graph library unless build forces it). Drag nodes, click connection handles, form for edge match text.  
   *Alternative:* `@xyflow/react` — acceptable if MUI-only canvas proves too costly; prefer zero new deps first.

4. **Node content**  
   v1 nodes carry their own `title`/`body` (may be copied from catalog templates like attendance). Linking live catalog ids is a later optimization.

5. **Match semantics**  
   Normalize reply: trim + lowercase. `equals` = full body match; `contains` = substring. First matching edge in stable edge order wins. No match → leave run `awaiting_reply` (no auto-send).

6. **Start semantics**  
   `POST .../flows/:id/start { contactId }` sets/resets run, sends `startNode` body, sets `awaiting_reply`. One active run per contact (replace or reject if already awaiting — **reject** with 409 in v1).

7. **Frontend / Core split in this monorepo workspace**  
   This OpenSpec change tracks frontend artifacts + BFF. Core tasks are listed as sibling work in `nodika-core` and must land before auto-progress works in production.

## Risks / Trade-offs

- **[Risk] Wrong thread match (latest open outbound)** → Mitigation: when sending flow messages, tag `source: 'flow'` + `flowId`/`nodeId`; matcher prefers open outbound with matching flow metadata.
- **[Risk] Ambiguous replies** → Mitigation: edge order + document that operators should ask for keywords (`día completo`).
- **[Risk] Graph cycles** → Mitigation: allow cycles but cap auto-sends per run (e.g. 20) to avoid infinite loops.
- **[Risk] Editor complexity** → Mitigation: v1 layout is free-form positions only; no auto-layout.

## Migration Plan

- No migration of old catalog rows.
- Rollback: disable flow start UI + Core feature flag / skip flow evaluation in webhook.

## Open Questions

- Whether idle timeout (no reply in N days) advances a default edge — **out of v1**.
- Whether attendance catalog template auto-creates a starter flow — **optional follow-up**.
