## Context

The Staff page already has an employee roster grid and a template editor with token legend. History exists as `StaffMessage` (outbound/inbound) but lacks a reusable catalog of assignable messages, assignment UX, truncated previews, and latency fields precise enough for later AI analysis.

## Goals / Non-Goals

**Goals:**

- Catalog Data Grid: title, truncated body preview, assigned employee, actions (assign / send)
- Assign a catalog message to one staff member (replaceable assignment for v1)
- Persist full message and reply text in Core; never truncate in the database
- On reply (webhook/inbound), link to the prior outbound thread and store `repliedAt`, `responseLatencyMs`, and `responseStatus`
- Keep template interpolation legend as ayuda-memoria below the editor

**Non-Goals:**

- Multi-assignee fan-out UI in v1 (one primary assignee per catalog row)
- Shipping the AI analyzer itself
- Truncating stored DB content

## Decisions

### 1. Separate catalog collection vs templates

Templates remain reusable interpolable bodies. Catalog messages are concrete title+body items operators curate and assign. Sending a catalog message creates a precise `StaffMessage` outbound thread (optional `catalogMessageId` + full `title`/`body`).

### 2. AI-ready StaffMessage fields

Outbound records store: `title`, `body` (full), `catalogMessageId?`, `templateKey?`, `sentAt`, `providerMessageId`, `threadId` (self id or shared), `source`.  
Inbound / reply completion updates the outbound thread (preferred) or linked inbound with: `replyBody`, `repliedAt`, `responseLatencyMs`, `responseStatus`, `receivedAt`.

Latency = `repliedAt - sentAt` in milliseconds (integer). Semaphore stored server-side with same 2d / 5d thresholds as the roster so UI and AI see the same labels.

### 3. UI truncation

Display truncates body to ~100 characters with ellipsis; tooltip or expand shows full text. Database and BFF APIs always return full strings.

### 4. Assignment

`assignedContactId` on catalog message (nullable). Assign action sets the contact; Send uses assignee (or prompts if missing).

## Risks / Trade-offs

- [Inbound arrives before we can match outbound] → match by phone to latest unmatched outbound within a window (7 days); store unmatched inbound still with full text
- [Truncation confusion] → tooltips + “full text in DB” documentation in design; UI labels “vista previa”

## Open Questions

- Whether Evolution delivery receipts can set `deliveredAt` later (leave field optional now)
