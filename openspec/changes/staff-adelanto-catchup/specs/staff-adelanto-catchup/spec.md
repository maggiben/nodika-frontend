## ADDED Requirements

### Requirement: Adelanto catalog preset in Mensajes del equipo

The staff catalog UI SHALL offer an adelanto / catch-up preset that fills title and body asking whether the team worked on any other or ahead-of-schedule task, which one, and how much was advanced or worked.

Applying the preset SHALL mark the draft so create persistence can identify it as adelanto copy for Core (for example via an `adelanto` tag), distinct from attendance/performance/work-progress presets.

#### Scenario: Operator applies adelanto preset

- **WHEN** the operator selects the adelanto preset on Mensajes del equipo
- **THEN** the create form title and body are filled with the adelanto catch-up copy for the active locale
- **AND** the draft is marked as adelanto for the subsequent create request

#### Scenario: Help explains window vs adelanto

- **WHEN** the operator views Mensajes del equipo
- **THEN** the UI shows short help that automatic task asks only cover tasks whose planned dates include today
- **AND** that the adelanto message is intended to be sent last to record work done ahead of schedule
