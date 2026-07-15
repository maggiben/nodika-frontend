# Frontend Tooling

## Purpose

Define reproducible quality checks and project tooling for the frontend.

## Requirements

### Requirement: Strict TypeScript compilation

The project SHALL use strict TypeScript configuration for application source.

#### Scenario: Type-checking a production build

- **WHEN** `npm run build` runs
- **THEN** Next.js SHALL type-check the application using `tsconfig.json`
- **AND** the build SHALL fail for TypeScript errors

### Requirement: Lint and format commands

The project SHALL provide commands to lint source and verify Prettier formatting.

#### Scenario: Running code-quality checks

- **WHEN** a contributor runs `npm run lint` and `npm run format:check`
- **THEN** ESLint SHALL evaluate project source with the Next.js and TypeScript configuration
- **AND** Prettier SHALL verify the repository formatting rules

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

### Requirement: MUI X Community visualization packages

The project SHALL depend on the community editions of MUI X Charts and Data Grid (`@mui/x-charts`, `@mui/x-data-grid`) for dashboard visualizations and tabular display.

#### Scenario: Inspecting package dependencies

- **WHEN** a contributor inspects `package.json` dependencies
- **THEN** `@mui/x-charts` and `@mui/x-data-grid` SHALL be listed
- **AND** Pro/Premium licensed MUI X packages SHALL not be required for the project dashboard
