## Context

Vitest currently runs Node-only unit tests with no coverage provider or Git hook. The app includes server logic and Material UI Client Components, so both Node and jsdom environments are required.

## Goals / Non-Goals

**Goals:** enforce 80% global coverage for maintained source; block commits that fail it; test current validation, upload route, UI, and theme behavior.

**Non-Goals:** enforce coverage on generated files, archived OpenSpec artifacts, or third-party code.

## Decisions

- Use `@vitest/coverage-v8` because it is maintained with Vitest and has no separate transpiler instrumentation.
- Use jsdom and React Testing Library for component tests; retain Node for server tests via per-file environment annotations.
- Use Husky’s `pre-commit` hook to run `npm run test:coverage`; a non-zero result blocks the commit.
- Cover `src/**/*.{ts,tsx}` while excluding `*.test.*`, Next generated declarations, and test setup files.

## Risks / Trade-offs

- [Pre-commit runs more slowly] → The current source is small; tests remain deterministic and local.
- [Coverage can encourage shallow tests] → Scenarios validate observable UI, server errors, and semantic validation, not only line execution.
