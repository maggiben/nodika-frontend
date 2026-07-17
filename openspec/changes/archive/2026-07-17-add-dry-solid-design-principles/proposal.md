## Why

Design and implementation guidance in OpenSpec does not yet require DRY or SOLID, so changes can introduce duplicated knowledge and poorly separated modules without a normative check. Codifying these principles in governance makes them part of every proposal and design review.

## What Changes

- Extend specification governance so OpenSpec designs and implementations MUST apply DRY and SOLID (adapted to this Next.js frontend).
- Add matching OpenSpec `config.yaml` design rules so agents and contributors address these principles when writing designs.
- Align `.ai/constitution.md` non-negotiable principles with the same DRY and SOLID requirements (already partially drafted; finalize under this change).

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `specification-governance`: Require DRY and SOLID as normative design principles for behavior-changing OpenSpec work.

## Impact

- Updates `openspec/specs/specification-governance/spec.md` (via delta), `openspec/config.yaml` design rules, and `.ai/constitution.md`.
- No application runtime code, APIs, dependencies, or product UI changes.
- Future OpenSpec designs MUST call out how shared logic stays single-sourced and how module responsibilities follow SOLID.
