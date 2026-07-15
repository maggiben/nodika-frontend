# Proposal: Staff WhatsApp messaging

## Why

Operators need to manage area-lead WhatsApp numbers and status message templates from the app, with a safe test send, instead of relying only on admin API access.

## What

- Avatar menu link to a Staff page
- Manage staff WhatsApp contacts (label + phone)
- Configure message templates with `{{duration}}`, `{{avance}}`, `{{percent}}`, etc., plus an on-screen legend
- Test-send button for a selected contact
- BFF proxy to Core messaging APIs
- Avatar initials fix for existing sessions (client fallback)

## Impact

- application-shell navbar
- new staff-messaging UI/BFF
- Core messaging roles + test-send endpoint
