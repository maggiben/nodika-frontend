## 1. Core message history (nordika-core sibling)

- [x] 1.1 Add a message collection (outbound/inbound) linked to WhatsApp contacts with templateKey, body, provider ids, and timestamps
- [x] 1.2 Record outbound messages on test-send, weekly dispatch, and remind
- [x] 1.3 Add roster aggregate endpoint joining staff contacts with lastSentAt, lastReceivedAt, and template keys
- [x] 1.4 Add remind endpoint that resends the last successful outbound message for a contact
- [x] 1.5 Add Evolution inbound webhook (or stub) so lastReceivedAt can turn status green when replies arrive
- [x] 1.6 Soft-deactivate contacts on remove; list active staff-tagged contacts for the roster

## 2. Frontend BFF

- [x] 2.1 Add `/api/messaging/roster` proxy with session auth
- [x] 2.2 Add `/api/messaging/remind` proxy
- [x] 2.3 Ensure contact create / deactivate-or-delete BFF covers add/remove from the Staff page
- [x] 2.4 Extend messaging BFF client helpers and types for roster rows

## 3. Staff roster UI

- [x] 3.1 Refactor Staff page primary UI to an MUI X Data Grid with sortable columns and quick filter
- [x] 3.2 Render response health icons (green / yellow / red / neutral) with tooltips and aria-labels using 2-day and 5-day thresholds
- [x] 3.3 Move test-send into per-row grid actions
- [x] 3.4 Add re-reminder action with confirm dialog when last outbound exists
- [x] 3.5 Keep add-employee form and remove action wired to contact APIs
- [x] 3.6 Keep template editor + token legend as a secondary section below the grid
- [x] 3.7 Add i18n keys (es/en) for grid columns, statuses, and actions

## 4. Validation

- [x] 4.1 Add/update Vitest coverage for roster status helpers and critical UI behavior (exclude heavy grid chrome from coverage if needed)
- [x] 4.2 Run lint, tests with coverage gate, and production build
- [x] 4.3 Run `npm run spec:validate`
