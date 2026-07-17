## ADDED Requirements

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
