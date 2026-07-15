# Reusable Prompt Library

## Implement a feature

“Implement `<requirement>` in Nodika Frontend. Inspect `src/app` and `.ai/constraints/` first. Keep Server Components by default, define typed boundaries, avoid inventing backend services, and finish with lint, format check, tests, and build results.”

## Fix a bug

“Reproduce `<bug>` in the affected App Router route. State the root cause with file evidence, add a regression test when supported by the Node Vitest setup, apply the smallest safe fix, and report validation.”

## Review code

“Review this Nodika Frontend diff using `.ai/checks/code-review.md`, `security.md`, and `accessibility.md`. Only report evidence-backed findings; account for the fact that no API, database, auth, or design system exists yet.”

## Explain code

“Explain `<file or symbol>` in terms of the current Next.js App Router architecture. Identify server/client boundaries, data flow, configuration dependencies, and any Next 16 considerations.”

## Write documentation

“Update `.ai/docs/` for `<change>`. Reference exact paths and existing commands. Do not describe services, environment variables, or deployment infrastructure that the repository does not contain.”

## Create a migration

“Assess whether `<proposed migration>` applies to this repository. There is currently no persistence layer. If introducing one, first propose the runtime contract, data ownership, validation, backward compatibility, rollback, and tests; do not generate a speculative schema.”

## Generate tests

“Add focused Vitest tests for `<behavior>` under `src/`, compatible with the current Node environment. Prefer pure behavior; justify any new browser-test dependency and report `npm test` results.”
