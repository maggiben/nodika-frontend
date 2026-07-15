# Testing Constraints

- Do not claim coverage that does not exist: the starter currently contains no test files.
- Add regression tests with bug fixes whenever behavior is testable in the configured Node environment.
- Prefer deterministic unit tests; mock time, randomness, and remote boundaries.
- Keep `npm run lint`, `npm run format:check`, and `npm run build` green for every code change.
- Change the Vitest environment only with the minimal justified renderer/setup dependencies.
