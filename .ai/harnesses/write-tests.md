# Write Tests

## Goal

Add high-signal tests compatible with the configured Vitest Node environment.

## Steps

1. Identify pure logic or server-safe behavior to exercise.
2. Create a colocated `*.test.ts` or `*.test.tsx` under `src/`.
3. Use Vitest assertions; add only the test dependencies justified by browser/UI requirements.
4. Test errors and boundaries, not implementation details.

## Expected output

Stable tests that pass through `npm test`.

## Validation

Run `npm test`, `npm run lint`, and `npm run format:check`.

## Rollback strategy

Remove only tests for behavior removed with the feature; never delete failing tests to mask a defect.

## Checklist

- [ ] Covers an observable requirement
- [ ] Uses no network or time-dependent behavior without control
- [ ] Matches `vitest.config.mts` include pattern
- [ ] DOM tooling justified before being added
