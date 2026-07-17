## Why

Org charts for jefes de obra are stored only in the browser (`nodika.staffOrgCharts.v1`). They do not survive device changes, are invisible to Core dispatch/progress, and cannot be shared across operators. Operators also need to assign each lead to one or more obras while editing that chart, with membership persisted in Mongo via Core—not left as a read-only roster column.

## What Changes

- **BREAKING**: Stop reading/writing org charts from browser `localStorage`; Core is the source of truth.
- Load and save a lead’s reports (operario / jornalero / otro) through authenticated BFF routes that proxy Core contact org-chart fields.
- In the org-chart editor, let the user select **one or more projects** for that lead and persist the selection as contact `projectIds` (replace semantics via Core).
- Keep roster team-size counts and catalog draft helpers, but drive them from Core-backed chart data (with a short-lived in-memory cache / subscribe pattern as needed).
- Drop the “stored only in this browser” notice; surface save/load errors from the BFF instead.
- Non-goals: multi-level trees beyond lead + direct reports; inventing endpoints outside the sibling Core change `staff-org-chart-persistence`; migrating every historical localStorage chart automatically (optional one-shot import may be a follow-up).

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `staff-org-chart`: Persist org charts and project membership through Core instead of local browser storage; editor supports multi-project assignment.

## Impact

- Frontend: `src/lib/staff-org-chart.ts` (storage → Core client), `staff-org-chart-editor`, `staff-messaging-form` team column, draft helpers/tests, i18n copy.
- BFF: extend messaging contact proxy usage (GET roster/contact already available; PATCH contact for reports + `projectIds`); no new env vars.
- Depends on sibling Core change `staff-org-chart-persistence` (org reports on contact + replace `projectIds` when the array is sent).
- Catalog attendance/performance presets keep using chart reports once loaded from Core.
