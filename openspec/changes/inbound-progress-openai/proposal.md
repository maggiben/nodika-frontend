## Why

Jefes de obra, operarios y jornaleros reportan avance por WhatsApp en texto libre (a menudo mal escrito). Hoy el dashboard solo refleja `avance_base` del snapshot estático y el navbar no muestra avance vivo, así que los charts no se actualizan con lo respondido inbound. Necesitamos parsear esas respuestas con OpenAI (más exacto que regex/texto plano) y exponer el avance agregado en UI.

## What Changes

- Add an obra progress indicator (compact chip) in the shared navbar next to the project selector, showing total % and role breakdown (jefe de obra / operarios / jornaleros).
- Update the landing dashboard charts and progress labels so they refresh from live parsed inbound progress for the selected obra (not only snapshot `avance_base`).
- Add a BFF route that proxies Core’s obra-progress API (authenticated session cookies → Core).
- Depend on sibling **nodika-core**: parse inbound catalog / task-checklist replies with the OpenAI SDK, persist structured progress, and expose it for the selected project. Frontend does not call OpenAI directly.
- Document `OPENAI_API_KEY` (and optional model env) as **Core** server-only configuration; operators keep the key in Core’s `.env`.
- Add ES/EN copy for the navbar indicator and empty/unavailable progress states.

## Capabilities

### New Capabilities

- `obra-progress`: Navbar progress chip, BFF proxy for live obra progress, and merging of parsed inbound progress into dashboard visualizations by role and overall %.

### Modified Capabilities

- `application-shell`: Shared navbar shows an obra progress indicator when a project is selected and progress data is available.
- `project-dashboard`: Dashboard gauge/bar visuals and progress labeling incorporate live inbound-derived progress and refresh when it changes.

## Impact

- Frontend: `app-navbar`, new progress chip component, `project-dashboard`, messaging BFF proxy (`/api/messaging/progress` or equivalent), i18n dictionaries, Vitest coverage.
- Core (sibling `nodika-core`, separate change/implementation): OpenAI SDK, inbound parse on meaningful replies, persistence of structured progress, GET aggregation by `projectId` / role.
- Env: `OPENAI_API_KEY` on Core only (never `NEXT_PUBLIC_*`).
- Non-goals for this frontend change: Evolution webhook ownership, inventing alternate message stores in the browser, plaintext-only parsing fallbacks as the primary path.
