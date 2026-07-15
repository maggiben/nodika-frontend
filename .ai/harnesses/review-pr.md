# Review Change

## Goal

Review a change against the real current architecture, not assumed backend or product systems.

## Steps

1. Inspect the diff and affected `src/app` route boundaries.
2. Check Server/Client Component choices, TypeScript, and Material UI theme use.
3. Check accessibility, metadata, external links, and image handling.
4. Run relevant scripts and classify findings by user impact.

## Expected output

Evidence-backed findings, validation results, and explicit remaining risks.

## Validation

`npm run lint`, `npm run format:check`, `npm test`, `npm run build`

## Rollback strategy

Request a focused corrective patch; do not merge configuration work with unrelated visual changes.

## Checklist

- [ ] No unvalidated external or user input
- [ ] No unnecessary dependency
- [ ] No clientification of whole routes
- [ ] No stale starter metadata/content introduced
