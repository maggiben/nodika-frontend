## Why

Operators currently only get one catalog prefill (“Plantilla de asistencia”). They still type recurring asks for performance, hours worked, and weekly progress fields (percent, duration, avance, notes) by hand. A preset dropdown speeds up creating “Mensajes del equipo”.

## What Changes

- Replace the single attendance template button with a localized **dropdown of predefined message presets**.
- Keep the existing attendance draft.
- Add presets for team performance and jornada / progress (tiempo de trabajo, porcentaje cumplido, duración, avance, notas).
- Applying a preset fills title + body using the selected assignee’s local org chart when available (same as attendance).
- No new Core API.

## Capabilities

### New Capabilities

- `staff-catalog-presets`: Catalog create-form presets for common staff WhatsApp asks.

### Modified Capabilities

- (none — attendance behavior remains; UI entry point expands)

## Impact

- `staff-catalog-panel` UI + i18n
- Draft helpers next to attendance/performance builders
- Unit tests for new draft builders and preset application behavior
