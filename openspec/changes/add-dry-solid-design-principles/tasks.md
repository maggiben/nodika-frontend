## 1. Governance surfaces

- [x] 1.1 Add DRY and SOLID design rules to `openspec/config.yaml` under `rules.design` (maps to DRY/SOLID requirements)
- [x] 1.2 Finalize `.ai/constitution.md` non-negotiable principles 8–9 for DRY and frontend-adapted SOLID (align with delta wording)
- [x] 1.3 Confirm `.ai/constraints/architecture.md` still forbids duplicating business logic across routes/Client Components (compatible with DRY; adjust only if contradictory)

## 2. Spec sync readiness

- [x] 2.1 Ensure delta `specs/specification-governance/spec.md` ADDED requirements match constitution/config wording
- [x] 2.2 Run `npm run spec:validate` and fix any OpenSpec validation failures

## 3. Validation

- [x] 3.1 Run format check on touched docs (`npm run format:check` or format touched files)
- [x] 3.2 No app code change expected; skip full production build unless config/constitution edits affect tooling unexpectedly
