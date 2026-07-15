## ADDED Requirements

### Requirement: Pre-commit lint gate

The project SHALL run ESLint as part of the pre-commit quality gate before a Git commit completes.

#### Scenario: Committing with lint failures

- **WHEN** a contributor creates a Git commit and ESLint reports errors
- **THEN** the pre-commit hook SHALL fail
- **AND** Git SHALL block the commit

#### Scenario: Committing after lint passes

- **WHEN** a contributor creates a Git commit and ESLint succeeds
- **THEN** the pre-commit hook SHALL continue with the coverage suite
