## Why

Operators need attendance history shared across devices. Browser `localStorage` is not durable enough; marks must use Core Mongo via the messaging BFF, matching org-chart persistence.

## What Changes

- Persist attendance marks in Core (`attendanceMarks` on the lead contact), not `localStorage` as source of truth.
- Add BFF GET/PUT proxies for `/api/messaging/contacts/:id/attendance`.
- Load the selected month from Core on open; save month marks to Core on each edit (replace-that-month semantics).
- Keep in-memory cache + UI events; clear legacy localStorage key.
- Update i18n storage note to say data is saved in Nodika (database).

## Capabilities

### New Capabilities

- (none — extends existing change capability)

### Modified Capabilities

- `staff-attendance-sheet`: Require Core-backed persistence through the messaging BFF instead of browser-only storage.

## Impact

- Depends on Core change `staff-attendance-persistence`
- `src/lib/staff-attendance.ts`, BFF routes, attendance sheet UI/i18n/tests
