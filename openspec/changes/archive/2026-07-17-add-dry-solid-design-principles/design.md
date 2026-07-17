## Context

OpenSpec already governs how changes are proposed, designed, specified, validated, and archived (`specification-governance`). `.ai/constitution.md` holds non-negotiable project principles and is referenced from `openspec/config.yaml`, but DRY and SOLID are not yet normative in OpenSpec artifacts or design rules. This change is documentation and governance only: no Server/Client Component split, no runtime UI, and no new dependencies.

## Goals / Non-Goals

**Goals:**

- Make DRY and SOLID mandatory design constraints for behavior-changing OpenSpec work.
- Surface them in `openspec/config.yaml` design rules so proposal/design authors address them by default.
- Keep `.ai/constitution.md` aligned as the short-form agent-facing restatement.

**Non-Goals:**

- Refactor existing application modules to “become SOLID.”
- Add automated lint rules or static analysis for SOLID (manual review via design + code review is enough).
- Invent backend architecture patterns or service layers that do not exist in this frontend.

## Decisions

- **Capability**: extend `specification-governance` with ADDED requirements rather than a new capability—these are process/design rules, not a product feature.
- **Frontend-shaped SOLID**: document principles in terms of modules, components, props, and typed lib boundaries (not classical OOP class hierarchies).
- **DRY scope**: “don’t duplicate knowledge” (domain rules, validation, mapping, formatting)—not “never repeat JSX markup.”
- **Dual surfaces**: OpenSpec delta + `config.yaml` rules for change workflow; constitution for always-on agent context. Same wording intent, different audiences.
- **Server/Client**: N/A for this change; principles still apply when future designs choose Client Components—shared logic stays in typed modules, not duplicated across boundaries.

## Risks / Trade-offs

- [Principles can become cargo-cult checklists] → Require designs to state concrete extraction or responsibility choices, not buzzword lists.
- [Over-extraction / premature abstraction] → DRY applies to shared knowledge that already exists in two places or is about to; do not invent shared layers for one caller.
- [Rollback] → Revert the governance delta, config rules, and constitution bullets; no runtime impact.

## Migration Plan

1. Land proposal, design, delta spec, and tasks.
2. Apply: update `openspec/config.yaml`, finalize `.ai/constitution.md`, sync/archive via normal OpenSpec flow.
3. No production deploy steps.

## Open Questions

- None; wording can be tightened during apply if review prefers shorter constitution bullets.
