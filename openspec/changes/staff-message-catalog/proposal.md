## Why

Operators need a reusable catalog of distinct WhatsApp messages that can be assigned to specific staff members — not only weekly templates — and a precise, AI-ready history of when each message was sent, received, and answered for response-time metrics.

## What Changes

- Add a Staff page Data Grid of catalog messages (title + truncated body)
- Allow assigning a catalog message to a particular employee and sending it
- Keep the interpolation legend for templates as an ayuda-memoria
- Persist full outbound/inbound text and precise timing fields (sent, replied, latency ms, semaphore) for later AI analysis — **DB stores full text, UI truncates only**
- Surface per-delivery semaphore (green / yellow / red) from stored latency metrics

## Capabilities

### New Capabilities

- `staff-message-catalog`: Catalog message grid with assign-to-member, truncated preview, and AI-ready delivery/response metrics

### Modified Capabilities

- (none in main specs yet; builds on prior staff roster work)

## Impact

- Staff page UI (`staff-messaging-form` or sibling component)
- BFF routes under `/api/messaging/catalog` and message/thread listing
- Core messaging: catalog collection + richer `StaffMessage` fields
- i18n es/en
