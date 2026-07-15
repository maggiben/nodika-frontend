## Context

Mensajes del equipo are Core catalog rows with literal title/body. Org charts already store operarios/jornaleros per lead in the browser. Operators need a one-click attendance questionnaire for those reports.

## Goals / Non-Goals

**Goals:**

- Draft Spanish/English attendance text listing each report with full day / half day / absent choices.
- Prefill the catalog create form from that draft when the user picks a template action.
- Prefer the currently selected assignee’s org chart; fall back to a short untitled placeholder list.

**Non-Goals:**

- Parsing replies into structured attendance records.
- New Core template keys or schema fields.
- Multi-day schedules or geolocation.

## Decisions

1. **Catalog literal body (not Core `{{tokens}}`)** — Attendance is a one-shot WhatsApp ask with named people; catalog already sends full text.
2. **Reuse local org chart** — Same store as the org editor; no Core hierarchy API.
3. **Client Component prefiller** — Button on the create tile sets `title`/`body` in React state before save.

## Risks / Trade-offs

- **[Risk] Org chart empty/missing** → Prefill a 3-slot anonymous placeholder and note that names come from the org editor.
- **[Risk] Local-only org data** → Same notice as org editor; draft names only exist on that device.

## Open Questions

- None blocking.
