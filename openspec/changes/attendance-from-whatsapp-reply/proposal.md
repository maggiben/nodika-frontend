## Why

Attendance planilla marks should be filled from the existing «Asistencia del equipo» catalog preset replies. The frontend must tag those catalog rows so Core can ingest them.

## What Changes

- Apply tag `attendance` when the attendance catalog preset is used (same pattern as `adelanto`).
- Optional copy on the attendance sheet noting WhatsApp replies update the planilla.

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `staff-attendance-sheet`: Document that WhatsApp attendance replies may populate marks (informational UI).

## Impact

- `staff-org-chart-draft` preset tags + tests
- Attendance sheet i18n note
- Depends on Core `attendance-from-whatsapp-reply`
