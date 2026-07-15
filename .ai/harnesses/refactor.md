# Refactor

## Goal

Improve structure without changing observable behavior.

## Steps

1. Identify the duplication, coupling, or clarity issue in a concrete file.
2. Define behavior to preserve and add characterization tests if feasible.
3. Make small moves that respect the `src/app` route boundary.
4. Remove dead exports and stale imports in the same focused change.

## Expected output

A simpler ownership boundary with unchanged route behavior.

## Validation

Run `npm run lint`, `npm run format:check`, `npm test`, and `npm run build`.

## Rollback strategy

Keep refactors behavior-neutral and separately commit-ready so they can be reverted without feature rollback.

## Checklist

- [ ] No API or architecture invented
- [ ] No Client Component boundary widened
- [ ] Behavior preserved
- [ ] Imports use the existing `@/*` alias convention where useful
