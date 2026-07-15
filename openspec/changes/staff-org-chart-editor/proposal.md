## Why

Jefes de obra on the Staff roster are only stored as a WhatsApp label + phone. Operators cannot record who reports to each lead (operarios, jornaleros), so they cannot count people under that lead or draft a performance follow-up that names each person.

## What Changes

- Add an **Edit** action on each Staff roster row that opens an org-chart editor for that lead.
- Let users build a simple hierarchy under a jefe de obra: direct reports with a role (`operario`, `jornalero`, or free-text) and a display name.
- Persist per-lead org charts in the browser (no new Core contact fields in this change).
- Show how many people each lead has under them on the roster (and in the editor).
- From the editor, generate a Spanish/English draft WhatsApp-style message asking the lead about each report’s performance, with a copy action and optional send through the existing staff messaging test-send path when the lead has a phone.
- Non-goals: inventing Core org-chart APIs, multi-level trees beyond one manager + reports, payroll or HR systems, or automatic AI scoring of replies.

## Capabilities

### New Capabilities

- `staff-org-chart`: Local per-lead org chart editing, subordinate counts on Staff, and performance-question message drafting from that chart.

### Modified Capabilities

- (none in `openspec/specs/` — Staff roster grid requirements still live only under prior changes; this change adds a dedicated capability instead of inventing a main-spec migration mid-flight.)

## Impact

- Staff roster actions column and i18n (`staff.*`)
- New localized route for the org-chart editor
- Client-side storage module for org charts keyed by Core contact id
- Tests for storage, counts, draft message, and roster Edit navigation
- No new server-only env vars; no speculative Core schema change
