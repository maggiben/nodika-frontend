## Context

The planilla already works with browser storage. Org charts persist on `WhatsAppContact` via PATCH. Core adds `attendanceMarks` plus GET/PUT `/messaging/contacts/:id/attendance` with month replace semantics.

## Goals / Non-Goals

**Goals:**

- Core is the source of truth for marks.
- BFF proxies Core attendance routes.
- Sheet loads month from Core; each cell save PUTs the full month snapshot for that lead.
- Clear legacy `nodika.staffAttendance.v1`.

**Non-Goals:**

- Offline-first sync.
- Inventing Core fields beyond the sibling Core change.

## Decisions

1. **Month PUT after each edit** — Rebuild that month’s marks from memory and PUT; preserves other months on Core.
2. **In-memory cache only** — No localStorage as source of truth.
3. **Shared module** — `staff-attendance.ts` owns parse/tally/CSV + async load/save.

## Risks / Trade-offs

- **[Risk] Core not deployed** → Show save/load errors; do not silently fall back to localStorage.
- **[Risk] Concurrent edits** → Last month PUT wins.

## Migration Plan

1. Deploy Core `staff-attendance-persistence`.
2. Deploy frontend BFF + Core-backed module.
3. Operators re-enter any marks that only lived in a browser (no auto-import).
