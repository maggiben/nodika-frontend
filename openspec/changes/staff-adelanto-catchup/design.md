## Context

Mensajes del equipo already offers presets (`attendance`, `performance`, `workProgress`) that fill title/body before create. Scheduled checklist asks live in Core and currently ignore task dates. Operators need a preset that drafts the adelanto catch-up ask and clear UI copy explaining that only in-window tasks are auto-asked and adelanto goes last.

## Goals / Non-Goals

**Goals:**
- Add an `adelanto` catalog preset with Spanish/English draft asking about other/ahead-of-schedule work, which task, and how much advanced
- Tag or key the created catalog row so Core can treat it as adelanto copy (not a mid-catalog step)
- Show short help in the staff catalog panel about date-window asks + final adelanto
- Keep create/assign/send flows unchanged aside from preset + metadata

**Non-Goals:**
- Implementing date math or WhatsApp send order in the frontend (Core sibling)
- New BFF endpoints beyond existing catalog CRUD/assign
- Dashboard changes to highlight in-window tasks (optional follow-up)

## Decisions

### 1. Preset id `adelanto`
- **Choice:** Extend `CATALOG_MESSAGE_PRESET_IDS` with `adelanto`; draft body matches the product ask (¿trabajaron en otra tarea? ¿cuál? ¿cuánto se adelantó / se trabajó?).
- **Why:** Same UX as other team messages.

### 2. Marking for Core
- **Choice:** When creating from adelanto preset, send a stable tag or `templateKey`/`kind` field if catalog API already supports tags; otherwise put a sentinel in title prefix and document Core detection via tag `adelanto` once Core accepts it on create body.
- **Locked:** Prefer POST body field already proxied (e.g. `tags: ['adelanto']` or existing metadata). If Core create DTO lacks tags, include them in the sibling Core change and frontend payload together.
- **Why:** Core must exclude adelanto from catalog sequence and use body for post-checklist send.

### 3. Help copy
- **Choice:** i18n paragraph under catalog description: only tasks with today inside `ini`–`fin` are asked automatically; adelanto preset message is sent at the end to record early work.
- **Why:** Operators understand why fewer WhatsApps arrive than “all incomplete tasks”.

## Risks / Trade-offs

- **[Risk] Core not deployed yet** → Preset still useful as manual send; auto end-of-sequence needs Core.
- **[Risk] Tag not persisted** → Coordinate create DTO in Core change; add test that payload includes tag.
