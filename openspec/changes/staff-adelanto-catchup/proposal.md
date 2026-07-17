## Why

Scheduled WhatsApp task asks currently flood jefes with up to 20 incomplete snapshot tasks regardless of planned `ini`/`fin` dates, and there is no closing prompt to record work done ahead of schedule (e.g. July operators starting an August task). Operators need to author that catch-up ask from Mensajes del equipo and have it sent after the in-window checklist.

## What Changes

- Add a catalog preset in Mensajes del equipo to generate an editable **adelanto / catch-up** message (other task? which? how much advanced?).
- Document that Core (sibling change `task-window-and-adelanto`) only auto-asks objective tasks whose planned date window includes “today”, then sends this adelanto ask last when enabled/assigned.
- Surface short operator help copy so the team UI explains window filtering vs the final adelanto ask.
- No breaking API changes in this frontend; BFF continues to proxy catalog create/assign/send as today.

## Capabilities

### New Capabilities

- `staff-adelanto-catchup`: Mensajes del equipo preset + copy for the end-of-sequence adelanto ask.

### Modified Capabilities

- (none — no existing main-spec requirement changes; catalog presets live in change history)

## Impact

- `src/lib/staff-org-chart-draft.ts` (new preset id + draft builders)
- `src/components/staff-catalog-panel.tsx` (preset select + help text)
- `src/i18n/dictionaries/{es,en}.json`
- Tests for preset application
- Depends on sibling **nodika-core** change `task-window-and-adelanto` for date-window filtering and automatic end-of-checklist send of the adelanto catalog/message
