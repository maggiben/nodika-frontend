## MODIFIED Requirements

### Requirement: Test discovery

The project SHALL discover Vitest test files under `src/` using the configured test and spec naming patterns and support Node and jsdom environments.

#### Scenario: Adding a component test

- **WHEN** a contributor adds a `src/**/*.test.tsx` file requiring DOM APIs
- **THEN** Vitest SHALL provide the jsdom environment for that test
- **AND** the test SHALL execute as part of the test suite

#### Scenario: Adding a unit test

- **WHEN** a contributor adds `src/example.test.ts`
- **THEN** `npm test` SHALL include that file in the Vitest run
- **AND** the test SHALL execute in the configured Node environment
