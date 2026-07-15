## Why

Nodika’s primary users need Spanish UI copy, with English available as a second language. The app currently hardcodes English strings across the shell, auth forms, upload, and dashboard.

## What Changes

- Add locale-aware routing for `es` (default) and `en`
- Add translation dictionaries for user-facing UI strings
- Persist and switch language from the application shell (navbar)
- Redirect bare paths into the default/locale-prefixed routes while leaving `/api` unchanged

## Capabilities

### New Capabilities

- `internationalization`: locale routing, dictionaries, and language switching (es default, en secondary)

### Modified Capabilities

- `application-shell`: navbar language control and locale-aware navigation links
- `home-page`: home route lives under locale prefix
- `snapshot-upload`: upload route and form copy are localized
- `project-dashboard`: dashboard empty/status labels are localized
- `bff-authentication` (UI only): auth pages/forms use dictionary strings (API messages may remain English unless already localized by Core)

## Impact

- Move App Router pages under `src/app/[locale]/`
- Add `src/proxy.ts` for locale redirects
- Dictionaries under `src/i18n/`
- Navbar, auth form, dashboard, upload form and related tests
