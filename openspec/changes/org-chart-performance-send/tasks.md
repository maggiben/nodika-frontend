## 1. Editor send UX

- [x] 1.1 Add Enviar mensaje action to org-chart performance section; keep Generar / Copiar / editable draft
- [x] 1.2 Wire send to `POST /api/messaging/test-send` with `{ phone, text }` and success/error alerts; remove send-unavailable copy
- [x] 1.3 Add es/en i18n keys for send, sending, sent, send error, and missing phone

## 2. Tests and validation

- [x] 2.1 Extend org-chart editor tests for generate → edit → send (and blocked send without phone/draft)
- [x] 2.2 Run targeted tests, lint touched files, and `npm run spec:validate`
