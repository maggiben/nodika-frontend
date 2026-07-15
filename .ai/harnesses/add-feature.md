# Add Feature

## Goal

Deliver a user-facing capability while preserving the App Router’s server-first model.

## Steps

1. Locate the route in `src/app` and identify whether interactivity is actually required.
2. Define typed inputs, outputs, failure states, and acceptance criteria.
3. Add the smallest route/component/module structure that owns the feature.
4. Add focused tests where executable behavior exists.

## Expected output

Typed implementation, relevant metadata/accessibility, and tests or a documented reason they are not applicable.

## Validation

Run `npm run lint`, `npm run format:check`, `npm test`, and `npm run build`.

## Rollback strategy

Revert the feature’s isolated files and route links; do not alter shared configuration for a feature-only rollback.

## Checklist

- [ ] Server Component by default
- [ ] No invented service/API contract
- [ ] Keyboard and error states covered
- [ ] No unrelated starter cleanup
