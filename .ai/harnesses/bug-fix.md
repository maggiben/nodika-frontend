# Bug Fix

## Goal

Correct a reproducible defect with the smallest safe change.

## Steps

1. Capture the route, input, expected result, and actual result.
2. Trace the issue through the App Router component or configuration involved.
3. Add a regression test where the configured Node Vitest environment can exercise it.
4. Change only the faulty behavior and validate adjacent paths.

## Expected output

Root cause, regression coverage or a stated limitation, and a focused fix.

## Validation

Run the targeted test, then `npm run lint`, `npm run format:check`, and `npm run build`.

## Rollback strategy

Revert the focused patch; configuration changes require a successful build before release.

## Checklist

- [ ] Reproduction is explicit
- [ ] Cause differs from symptom
- [ ] No type/lint bypass
- [ ] Existing behavior preserved
