## Context

The Staff page today is a form: add phone/label, edit a weekly template, pick a contact for test-send. Contacts live as WhatsApp contacts with a `staff` tag. Core already stores `MessageDispatch` for ciclo weekly sends, but that is ciclo-scoped and outbound-only — it does not give a unified per-employee history or inbound replies.

Operators need a roster grid (MUI X Data Grid Community, already used on the dashboard) that answers: who is on staff messaging, when did we last message them, did they reply, and can we nudge them.

Core work for message history lives in `nordika-core` and is consumed only through the existing BFF pattern. This frontend design describes the UI and BFF shapes without treating Core schemas as OpenSpec frontend capabilities.

## Goals / Non-Goals

**Goals:**

- Staff page centered on a sortable Data Grid of active staff employees
- Columns for identity, message types seen, last sent, last received, response health icon, and actions
- Add / remove staff employees without leaving the page
- Per-row test send and re-reminder (resend last successful outbound body)
- Template editor remains available below the grid
- BFF aggregates roster rows from Core messaging history when available

**Non-Goals:**

- Building a full WhatsApp inbox UI or conversation thread view
- Changing ciclo weekly scheduler behavior beyond recording outbound messages into the shared history when Core supports it
- Real-time socket updates (refresh-on-action / manual reload is enough for v1)
- Multi-obra employee assignment (staff list remains global for now, same as contacts)

## Decisions

### 1. MUI X Data Grid Community for the roster

Reuse `@mui/x-data-grid` patterns from `ProjectDashboard`: compact density, sortable columns, quick filter, pagination. No Pro features (no row grouping / excel export license).

**Alternatives:** custom Table — rejected; sorting/filter UX would be weaker and diverge from dashboard.

### 2. Response health icons (thresholds)

Computed on the client from `lastSentAt` / `lastReceivedAt` (or from a Core-provided `responseStatus` if present):

| Status | Meaning | Default rule |
|--------|---------|--------------|
| Green | Replied promptly | Last receive ≥ last send, or reply within **2** days of last send |
| Yellow | Slow | No reply yet and age of last send is **> 2 and ≤ 5** days |
| Red | Overdue / silent | Sent and no reply after **> 5** days, or failed last send with no later success |
| Neutral | No traffic yet | Never sent |

Thresholds stay as named constants so they can be tweaked later.

### 3. Message history as source of truth (Core + BFF)

Core SHOULD persist a message collection (outbound + inbound) keyed by contact, with fields such as direction, body/rendered text, templateKey, providerMessageId, timestamps. The BFF exposes:

- `GET /api/messaging/roster` — staff contacts joined with lastSentAt, lastReceivedAt, lastTemplateKey, lastMessageTypes[], response hints
- `POST /api/messaging/contacts` / delete or deactivate — unchanged add / remove
- `POST /api/messaging/test-send` — existing; also records outbound when Core does
- `POST /api/messaging/remind` — resend last successful outbound for a contactId

If roster is unavailable, the UI falls back to listing staff contacts with empty timestamps and neutral icons (degraded mode), so add/remove still works.

**Alternatives:** derive everything from `MessageDispatch` only — rejected; dispatches are ciclo-week scoped and do not cover test sends or inbound replies.

### 4. Inbound replies via Evolution webhook (Core)

Green/yellow/red require inbound timestamps. Core should accept Evolution inbound webhooks (or equivalent) and insert `direction: inbound` messages matched by phone. Frontend only displays `lastReceivedAt`.

Until webhook is live, rows stay yellow/red based on outbound age (never green unless Core records inbound).

### 5. Add / remove staff

- **Add:** compact form above or in a toolbar dialog (label + phone) → create contact with `staff` tag (existing API)
- **Remove:** row action soft-deactivates (`active: false`) or deletes via existing contact API; deactivation preferred so history remains
- Grid lists **active** staff by default; optional filter for inactive later (non-goal for v1)

### 6. Component boundaries

- Page stays a Server Component shell (auth gate)
- Staff roster remains a Client Component (`StaffMessagingForm` refactor or `StaffRosterGrid`) for DataGrid + mutations
- Message copy and action results use alerts/snackbars already used on the form

### 7. Security / a11y

- All mutations go through BFF session auth (no Core tokens in the browser)
- Status icons include `aria-label` / tooltip text (not color-only)
- Reminder and test-send are rate-limited by Core; UI disables the button while in flight per row

## Risks / Trade-offs

- [No inbound webhook yet] → Icons never turn green until Core records replies; document degraded mode; still useful for last-sent + remind
- [Mis-matched phone numbers] → Normalize phone on BFF/Core when matching inbound
- [Remind spam] → Confirm dialog before re-reminder; show last sent age in the confirmation
- [Roster payload size] → Limit roster to staff-tagged active contacts; history rollup computed server-side

## Migration Plan

1. Ship Core message collection + roster + remind (+ webhook if ready)
2. Deploy frontend BFF + grid; keep template editor
3. Existing staff contacts appear immediately; timestamps fill as new sends/receives occur
4. Rollback: frontend can revert to previous form commit; Core history tables remain additive

## Open Questions

- Exact Evolution webhook payload path for inbound (Core-owned; frontend only needs `lastReceivedAt`)
- Whether remove should hard-delete or deactivate (default: deactivate)
- Whether yellow/red day thresholds should be configurable per obra (default constants for v1)
