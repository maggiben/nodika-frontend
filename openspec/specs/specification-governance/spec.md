# Specification Governance

## Purpose

Make OpenSpec the living source of truth for current behavior and proposed changes.

## Requirements

### Requirement: Current capability specifications

The project SHALL maintain current behavioral specifications in `openspec/specs/`, organized by capability.

#### Scenario: Understanding existing behavior

- **WHEN** a contributor plans a change
- **THEN** they SHALL read the relevant current capability specification
- **AND** they SHALL treat it as the source of truth for the behavior being changed

### Requirement: Proposed-change artifacts

The project SHALL capture each behavior-changing feature, bug fix, migration, dependency upgrade, or security change in an OpenSpec change before implementation.

#### Scenario: Proposing a behavior change

- **WHEN** a contributor proposes a change to a specified capability
- **THEN** they SHALL create a uniquely named change under `openspec/changes/`
- **AND** the change SHALL include proposal, design, task, and delta-spec artifacts required by the OpenSpec schema before implementation

### Requirement: Change validation and archival

The project SHALL validate implementation against change tasks and merge accepted delta specifications into current specifications before archival.

#### Scenario: Completing a change

- **WHEN** all implementation tasks are complete
- **THEN** the contributor SHALL run the relevant test, format, lint, and build validation
- **AND** they SHALL sync accepted delta specs and archive the completed change

### Requirement: Specification-quality rules

The project SHALL express behavioral requirements with normative language and verifiable scenarios.

#### Scenario: Writing a requirement

- **WHEN** a contributor creates or modifies a specification
- **THEN** each requirement SHALL use SHALL or MUST language
- **AND** each requirement SHALL include at least one scenario using GIVEN, WHEN, THEN, or AND statements
