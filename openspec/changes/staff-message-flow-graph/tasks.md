## 1. Core sibling (nodika-core) — required for auto-progress

- [x] 1.1 Add Flow + FlowRun Mongo models/DTOs/controllers under messaging (`CRUD` flows, `POST start`, list runs)
- [x] 1.2 On inbound webhook after matching open outbound, if outbound is a flow send: evaluate edges, send next node via Evolution, update FlowRun (cap steps; prefer flow-tagged outbound for matching)
- [x] 1.3 Tests for equals/contains matching, no-match, 409 on second start, step cap
- [x] 1.4 Deploy Core before expecting production auto-progress

## 2. Frontend BFF + types

- [x] 2.1 Add typed client parsers for Flow / FlowRun
- [x] 2.2 Add Next BFF proxies: `/api/messaging/flows`, `/api/messaging/flows/[id]`, start, and runs list/read
- [x] 2.3 Unit tests for parsers and BFF validation of malformed bodies

## 3. Flow graph editor UI

- [x] 3.1 Auth-gated localized Staff route/panel for flows list + editor canvas (nodes, drag, SVG edges, edge condition form, set start node, save)
- [x] 3.2 i18n (es/en) for editor, match types, start flow, errors
- [x] 3.3 “Start flow” control: pick roster contact + flow; surface Core errors (incl. 409)
- [x] 3.4 Optional: seed a blank flow or copy attendance text into a new node from existing helper

## 4. Validation

- [x] 4.1 Frontend: format, lint, test:coverage, build, `openspec validate staff-message-flow-graph`
- [x] 4.2 Core: unit tests + deploy; smoke-test reply → next message on WhatsApp in staging/production
