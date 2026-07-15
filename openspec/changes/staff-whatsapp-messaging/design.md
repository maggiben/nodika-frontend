# Design: Staff WhatsApp messaging

## UI

- Avatar menu includes **Staff** between settings and the logout separator
- Localized `/[locale]/staff` page (auth required)
- Sections: contacts list/form, message template editor with interpolation legend, test send

## Interpolation legend

Document: `{{percent}}`, `{{duration}}`, `{{avance}}`, `{{notes}}`, `{{week}}`, `{{ciclo_name}}`, `{{ciclo_inicio}}`, `{{ciclo_fin}}`

## BFF

- `GET/POST /api/messaging/contacts`
- `PATCH /api/messaging/contacts/[id]`
- `GET/POST /api/messaging/templates`
- `PATCH /api/messaging/templates/[key]`
- `POST /api/messaging/test-send`

## Core

- Allow `source_writer` or `message_admin` for contacts, templates, test-send
- Keep dispatch/run as `message_admin` only
- Add `POST /messaging/test-send` with phone + templateKey + sample vars

## Avatar initials

- Persist email cookie when `/api/settings` succeeds
- Navbar fetches settings client-side when authenticated but email is missing
