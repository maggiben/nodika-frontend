## Why

Operators need a ready-made team catalog message so each jefe de obra can report whether people under them worked a full day, a half day, or were absent — without drafting that text by hand every time.

## What Changes

- Add an attendance report draft builder that lists each person from a lead’s local org chart with options: full day / half day / absent.
- Add a catalog UI control to prefill the create form title + body from that template (using the selected assignee when possible).
- Keep using existing catalog create/assign/send — no new Core endpoints.

## Capabilities

### New Capabilities

- `staff-attendance-template`: Prefillable attendance check-in catalog message for people under a site lead.

### Modified Capabilities

- (none in `openspec/specs/`)

## Impact

- `staff-org-chart-draft` helpers and tests
- Staff catalog create form + i18n (en/es)
- Relies on local org charts (`nodika.staffOrgCharts.v1`); empty charts get a short placeholder list
