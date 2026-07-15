# Design: Pre-commit lint gate

## Approach

Extend `.githooks/pre-commit` to run quality checks in order:

1. `npm run lint`
2. `npm run test:coverage`

Fail fast on lint so contributors see style/rule violations before the longer coverage run.

## Notes

The Git root may be the parent monorepo; local clones still opt in with `git config core.hooksPath nodika-frontend/.githooks` (or the frontend root when the frontend is the git root).
