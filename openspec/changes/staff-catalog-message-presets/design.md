## Context

Mensajes del equipo already supports an attendance prefill that uses the assignee’s browser org chart. Operators also need the weekly-status style asks and per-person performance wording without leaving the catalog form.

## Goals / Non-Goals

**Goals:**

- One dropdown listing predefined presets (attendance + performance + jornada progress).
- Selecting a preset fills title and body; assignee stays selected.
- Prefer org-chart report names from the selected lead; never invent “Persona 1 / Person 1” placeholders.

**Non-Goals:**

- Core-owned template catalog for these drafts.
- Auto-sending on preset select (user still saves/sends via existing catalog flow).
- Token interpolation against live ciclo data at draft time (plain language questions; operator can edit).

## Decisions

1. **Frontend-only presets** — pure draft builders, same as attendance.  
2. **MUI Select** for presets to match the assign dropdown, not a separate menu library.  
3. **Preset set (v1):**
   - `attendance` — existing full/half/absent checklist  
   - `performance` — per-person performance ask (reuse/extend `buildPerformanceDraft`)  
   - `workProgress` — ask percent cumplido, duración, avance, notas, and work time for the jornada  
4. **Empty selection** — Select includes a “choose preset…” placeholder; applying happens on change.

## Risks / Trade-offs

- Drafts may need light edit before send → acceptable; fields stay editable.
- Org chart only local → documented via existing placeholder feedback messages.

## Migration Plan

N/A — UI-only.
