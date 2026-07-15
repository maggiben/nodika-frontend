## Context

Routes already share Material UI theming with light and dark color schemes enabled, but theme mode is not user-controllable and session actions live only on the home page.

## Goals / Non-Goals

**Goals:**

- Global navbar on all routes with Nordika branding.
- Avatar dropdown for authenticated users: theme light/dark/system and logout.
- Unauthenticated navbar actions for sign-in and register.
- Persist theme preference with Material UI color-scheme storage/scripts to avoid flash.

**Non-Goals:**

- Full preferences page or account profile editing.
- Role/admin navigation.
- Installing icon packs unless required for baseline Avatar/Menu affordances.

## Decisions

1. **Shell ownership** — Render the navbar from the root layout after reading the HttpOnly access-cookie presence server-side; pass `authenticated` into a client navbar.
2. **Theme control** — Use MUI `useColorScheme` / `InitColorSchemeScript` with the existing `colorSchemes` theme; preferences are Light, Dark, and System.
3. **Avatar** — Generic letter avatar (no email decode from JWT) until account identity is exposed safely to the client.
4. **Reuse logout** — Keep posting to `/api/auth/logout` then `router.refresh()`.

## Risks / Trade-offs

- [Hydration flash] → InitColorSchemeScript + suppressHydrationWarning on `html`.
- [Coverage drop from new UI] → Add focused jsdom tests for navbar menu and theme actions.

## Migration Plan

1. Ship navbar + theme prefs.
2. Remove home-page session button cluster.
3. Roll back by restoring layout/page without navbar if needed.

## Open Questions

None.
