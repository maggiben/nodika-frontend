## Decisions

1. **Editor order** — Maintain an ordered node list (from `startNodeId` following unique any-edges, else array order). DnD reorders that list, sets `startNodeId` to first, rebuilds consecutive `any` edges, and stacks canvas `position.y`.
2. **No new DnD library** — HTML5 drag-and-drop on the list.
3. **Runtime numbers** — `FlowRun.stepCount` already per contact; outbound title becomes `{step}/{total} · {node.title}` (1-based). Total = `flow.nodes.length`.
4. **Canvas** — Keep free drag for layout; list DnD is the authoritative sequence.
