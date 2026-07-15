## ADDED Requirements

### Requirement: Org chart editor for a staff lead

The application SHALL provide an authenticated, localized org-chart editor for a single Staff roster contact (jefe de obra) that can list people under that lead.

#### Scenario: Open editor from roster Edit

- **WHEN** an authenticated user activates Edit on a Staff roster row
- **THEN** the app SHALL navigate to a localized route scoped to that contact id
- **AND** the editor SHALL show the lead’s label (or phone) as the chart root

#### Scenario: Add operario and jornalero reports

- **WHEN** the user adds a report with a name and role `operario` or `jornalero`
- **THEN** the editor SHALL include that report under the lead
- **AND** SHALL persist the updated chart in browser storage keyed by the Core contact id

#### Scenario: Edit and remove reports

- **WHEN** the user renames, changes role, or removes a report
- **THEN** the stored chart for that lead SHALL update accordingly
- **AND** the editor SHALL reflect the change without leaving the page

#### Scenario: Unauthenticated access

- **WHEN** an unauthenticated user opens the org-chart route
- **THEN** the app SHALL redirect them to the localized login page

### Requirement: Subordinate count on Staff roster

The Staff roster Data Grid SHALL show how many people each lead has under them according to the local org-chart store.

#### Scenario: Counting reports

- **WHEN** a lead has N persisted reports in the local org chart
- **THEN** the roster row SHALL display N as the team size
- **WHEN** a lead has no chart or an empty report list
- **THEN** the roster row SHALL display 0

#### Scenario: Count updates after editing

- **WHEN** the user returns to Staff after saving org-chart changes for a lead
- **THEN** that lead’s team size on the roster SHALL match the saved report count

### Requirement: Performance question message draft

The org-chart editor SHALL let the user prepare a message that asks the lead about each report’s performance.

#### Scenario: Draft lists every report

- **WHEN** the lead has one or more reports and the user requests a performance message draft
- **THEN** the UI SHALL show a draft body that names the lead and each report (including role)
- **AND** SHALL provide a Copy action for that draft

#### Scenario: Empty chart draft

- **WHEN** the lead has zero reports
- **THEN** the UI SHALL explain that reports are required before drafting a performance message
- **AND** SHALL not imply a send succeeded

#### Scenario: Optional test send when supported

- **WHEN** the existing messaging test-send path can deliver free-text (or an equivalent already-proxied body) to the lead’s phone
- **THEN** the editor MAY offer a Send test action that delivers the draft to that phone through the existing BFF without inventing a new Core endpoint
- **WHEN** free-text send is not available through the existing BFF
- **THEN** the editor SHALL keep Copy available and SHALL NOT invent a new Core API for delivery
