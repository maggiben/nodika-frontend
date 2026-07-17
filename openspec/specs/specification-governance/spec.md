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

### Requirement: DRY in OpenSpec designs

Behavior-changing OpenSpec designs SHALL identify shared domain knowledge (rules, validation, formatting, mapping) and require a single typed module as the source of truth instead of duplicating that knowledge across routes, Client Components, or helpers.

#### Scenario: Designing shared validation

- **WHEN** a contributor writes a design that introduces or changes domain validation used in more than one place
- **THEN** the design SHALL name the shared module or extraction path
- **AND** the design SHALL NOT treat copy-paste of the same rule across UI and lib code as acceptable

#### Scenario: Reviewing duplicated knowledge

- **WHEN** a design review finds the same domain rule expressed in two modules
- **THEN** the change SHALL extract or consolidate that rule before archival
- **AND** tasks SHALL include the consolidation step

### Requirement: SOLID in OpenSpec designs

Behavior-changing OpenSpec designs SHALL apply SOLID adapted to this frontend: single responsibility per module or component; extension via composition and narrow props; substitutable helpers that honor shared contracts; segregated interfaces over catch-all bags; UI depending on typed abstractions rather than scattered I/O details.

#### Scenario: Designing a new feature surface

- **WHEN** a contributor designs a feature with UI, parsing, and storage concerns
- **THEN** the design SHALL separate those responsibilities into distinct modules or components
- **AND** the UI SHALL depend on typed lib boundaries rather than embedding persistence or parsing details

#### Scenario: Extending an existing capability

- **WHEN** a change adds a variant of existing behavior
- **THEN** the design SHALL prefer composition or shared utilities over editing unrelated stable paths for one-off cases
- **AND** interchangeable helpers SHALL keep the same contracts without special-case callers
