## 1. Core catalog and AI-ready messages

- [x] 1.1 Add StaffCatalogMessage model (title, body, assignedContactId, active)
- [x] 1.2 Extend StaffMessage with title, catalogMessageId, thread/reply fields, responseLatencyMs, responseStatus, source
- [x] 1.3 CRUD + assign endpoints for catalog messages; send-catalog creates precise outbound StaffMessage
- [x] 1.4 On inbound, match latest outbound thread, set replyBody/repliedAt/latency/status with full reply text
- [x] 1.5 List catalog + optional message history for staff UI

## 2. Frontend BFF and UI

- [x] 2.1 BFF routes for catalog CRUD, assign, and send
- [x] 2.2 Catalog Data Grid (title, truncated body, assignee, semaphore, actions) on Staff page
- [x] 2.3 Truncate helper + tooltip for full text; keep template legend
- [x] 2.4 i18n es/en for catalog UI

## 3. Validation

- [x] 3.1 Core + frontend tests for truncation, latency/status, catalog flows
- [x] 3.2 Lint, coverage gates, production build, `npm run spec:validate`
