# Proposal: Pre-commit lint gate

## Why

Commits currently only gate on coverage. ESLint failures can slip into `main` unless someone remembers to run `npm run lint` manually.

## What Changes

- Run `npm run lint` in the pre-commit quality gate before coverage
- Document the updated local hook activation
- Keep coverage gate behavior unchanged

## Impact

- `test-coverage-gate` / tooling pre-commit requirement
- `.githooks/pre-commit` and README
