## Context

Core’s `POST /sources` stores any valid JSON file. The frontend over-validates with a fixed `nodika-snapshot-v1` field/date schema, blocking uploads Core would accept.

## Goals / Non-Goals

**Goals:**

- Accept any syntactically valid JSON object for upload.
- Surface clear syntax errors comparable to JSONLint (message + position when available).
- Keep client and server validation aligned so the route cannot be bypassed by a malformed body.

**Non-Goals:**

- Adding a schema version registry or task semantics.
- Pretty-printing or autofixing JSON.
- Changing Core upload or auth behavior.

## Decisions

1. **Syntax-only validation** — Use `JSON.parse` and map `SyntaxError` text into a single root issue. Reject non-objects after parse because Core persistence expects an object payload in practice.
2. **Shared parser** — Keep `parseNodikaSnapshot` as the shared entry point for form and route, but change it to return the parsed object on success without schema checks.
3. **No new dependency** — Native parse errors are enough; avoid bundling the legacy `jsonlint` package.

## Risks / Trade-offs

- [Invalid but Core-accepted arrays] → Accepted trade-off: objects only remain required for a predictable upload document shape.
- [Schema mistakes slip through] → Core stores the document anyway; domain validation can return later if product needs it.

## Migration Plan

1. Ship frontend validation change.
2. No data migration.
3. Roll back by restoring schema validation module if needed.

## Open Questions

None.
