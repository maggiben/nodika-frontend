## Context

The org-chart editor already builds a performance draft (`buildPerformanceDraft`), shows an editable textarea, and copies to clipboard. Send is currently blocked with `staff.org.sendUnavailable` because Core `POST /messaging/test-send` only accepts `templateKey`. The frontend BFF already proxies the JSON body unchanged.

## Goals / Non-Goals

**Goals:**

- Let operators generate, edit, and send the performance draft to the lead’s WhatsApp from the org-chart page.
- Reuse `POST /api/messaging/test-send` (no new frontend route).
- Keep Copy as a fallback.

**Non-Goals:**

- Sending via the staff message catalog / sequential catalog flow.
- Parsing inbound replies into scored performance.
- Multi-recipient fan-out.

## Decisions

1. **Free-text via existing test-send BFF**  
   POST `{ phone, text }` where `text` is the edited draft. Template-key path remains for the Staff roster “Enviar prueba” action.  
   *Alternative considered:* create+send a catalog row — rejected because it pollutes the lead’s ordered catalog sequence and can conflict with awaiting-reply gating.

2. **Sibling Core must accept `text`**  
   Frontend OpenSpec does not invent a new BFF path; Core extends `TestSendDto` so `text` XOR `templateKey` is valid. Until Core is deployed, the UI surfaces the upstream error message.

3. **UI affordances**  
   Buttons: Generar / Copiar / Enviar. Enviar disabled when there is no draft text, no phone, or a send is in flight. Empty chart still blocks generate (existing behavior).

## Risks / Trade-offs

- [Core not yet accepting `text`] → Show API error; keep Copy. Deploy Core free-text support with this frontend change.
- [WhatsApp / Evolution not configured] → Surface 503 message from Core; do not pretend success.
- [Operator edits draft to empty] → Disable Enviar; do not call the API.

## Migration Plan

- Deploy Core free-text test-send first (or together).
- Deploy frontend; remove send-unavailable alert.
- Rollback: frontend Copy still works; Core template-only test-send remains for roster.

## Open Questions

- None blocking; title for outbound StaffMessage can stay empty / use a fixed “Performance check-in” label in Core when recording free-text sends.
