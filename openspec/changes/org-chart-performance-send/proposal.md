## Why

Operators already generate and edit a performance check-in draft on the org-chart page, but they still cannot deliver it to the jefe de obra from that screen. Copy-paste is a friction point when the goal is a quick WhatsApp consult about each report.

## What Changes

- Add an **Enviar mensaje** action in the org-chart “Consulta de performance” section that sends the current (editable) draft to the lead’s WhatsApp phone.
- Keep **Generar mensaje**, editable preview, and **Copiar**; remove the “send unavailable” copy once send is wired.
- Send through the existing authenticated `POST /api/messaging/test-send` BFF using free-text payload (`phone` + `text`) instead of a saved template key.
- Show clear success/error feedback (missing phone, empty draft, delivery failure).

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `staff-org-chart`: Promote optional performance test-send to a required Send action when the lead has a phone and a non-empty draft; clarify free-text delivery via existing test-send BFF.

## Impact

- `src/components/staff-org-chart-editor.tsx` (+ tests)
- i18n `staff.org.*` strings (es/en)
- Existing messaging BFF `POST /api/messaging/test-send` (proxies Core); requires Core `TestSendDto` to accept free-text `text` (sibling Core change, not a new frontend route)
