## Context

Next.js 16 App Router recommends `[lang]` segment routing plus dictionaries (or libraries such as next-intl). This project keeps dictionaries lightweight and uses `proxy.ts` for locale prefixes.

## Goals / Non-Goals

**Goals:**

- Locales: `es` (default) and `en`
- Prefixed routes: `/es/...`, `/en/...`
- Language switcher in the navbar
- Translate shell, auth forms, home/dashboard, and upload UI strings

**Non-Goals:**

- Translating Core BFF/API error payloads beyond mapping known safe client fallbacks
- Domain-based locales or region variants (`es-AR`)
- Right-to-left languages

## Decisions

1. **Routing** — `src/app/[locale]/...` for pages; `src/app/api` stays unprefixed.
2. **Default** — `es`. Missing locale redirects via `src/proxy.ts` using cookie `nordika.locale` if set, otherwise `es`.
3. **Dictionaries** — JSON files loaded on the server; `DictionaryProvider` exposes strings to client components.
4. **Switcher** — Sets cookie and navigates to the same path under the other locale.
5. **html lang** — Root layout reads locale from the path segment when possible; nested locale layout sets document language.

## Risks / Trade-offs

- Existing absolute links (`/login`, `/upload`) must become locale-aware or proxy-redirected.
- Tests must use `/es/...` or `/en/...` paths.

## Migration Plan

Proxy redirects unprefixed pages to `/es/...` (or cookie locale). No data migration.

## Open Questions

None.
