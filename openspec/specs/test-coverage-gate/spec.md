# test-coverage-gate Specification

## Purpose

TBD - created by archiving change enforce-test-coverage. Update Purpose after archive.

## Requirements

### Requirement: Enforced coverage threshold

The project SHALL enforce at least 80% global line, function, branch, and statement coverage for maintained source.

#### Scenario: Running the coverage suite

- **WHEN** a contributor runs `npm run test:coverage`
- **THEN** Vitest SHALL generate a V8 coverage report for maintained source files
- **AND** the command SHALL fail when any configured global threshold is below 80%

### Requirement: Pre-commit coverage gate

The project SHALL run the coverage suite before a Git commit completes.

#### Scenario: Committing tested changes

- **WHEN** a contributor creates a Git commit
- **THEN** the pre-commit hook SHALL run `npm run test:coverage`
- **AND** Git SHALL block the commit when the coverage command fails
