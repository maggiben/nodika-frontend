## Why

Operators need a single staff roster view that shows who receives WhatsApp messages, whether they replied and when, and lets them nudge late responders — not a form-only contact list with a separate test-send panel.

## What Changes

- Replace the primary Staff UI with a sortable MUI X Data Grid of staff employees who receive messages
- Show last sent / last received timestamps and a response health icon (green / yellow / red)
- Add per-row actions: test send and re-reminder (resend last outbound message)
- Allow adding and removing staff employees as the obra progresses
- Consume a Core message history (via BFF) that stores outbound/inbound messages linked to each employee, so different people can receive different message types over time
- Keep template editing as a secondary section under the grid

## Capabilities

### New Capabilities

- `staff-roster-grid`: Sortable staff employee grid with response status, timestamps, add/remove, test-send, and re-reminder actions; template editing remains a secondary section on the Staff page

### Modified Capabilities

- (none — prior staff messaging change is not yet archived into main specs)

## Impact

- `src/components/staff-messaging-form.tsx` (or replacement staff roster component)
- `src/app/[locale]/staff/page.tsx`
- BFF routes under `src/app/api/messaging/` (roster aggregate, remind, optional message list)
- i18n dictionaries (`staff.*`)
- Depends on Core messaging expose message history + roster fields over existing messaging auth (`source_writer` / `message_admin`)
- Uses existing `@mui/x-data-grid` community package (already in the project)
