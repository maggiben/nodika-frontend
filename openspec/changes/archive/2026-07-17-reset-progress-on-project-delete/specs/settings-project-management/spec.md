## MODIFIED Requirements

### Requirement: Delete project from settings

The Projects section SHALL let the user delete a listed project after an explicit confirmation. On success, the application SHALL refresh the project library so the project no longer appears in settings or the navbar selector, and Core-backed progress for that project (WhatsApp message send state, task checklist, and live obra `%`) SHALL be cleared so a later re-upload of the same obra starts clean. Delete MUST NOT proceed without confirmation.

#### Scenario: Confirm and delete

- **WHEN** the user chooses delete for a listed project and confirms
- **AND** the BFF delete succeeds
- **THEN** the application SHALL refresh the project library
- **AND** that project SHALL no longer appear in the Projects section

#### Scenario: Confirm and delete resets progress for re-upload

- **WHEN** the user confirms delete for a project that had WhatsApp or obra progress
- **AND** the BFF delete succeeds
- **AND** the user later uploads a snapshot with the same project id
- **THEN** the application SHALL treat that obra as having no prior WhatsApp send progress and no prior live obra progress from the deleted instance

#### Scenario: Cancel delete

- **WHEN** the user chooses delete for a listed project and cancels the confirmation
- **THEN** the application SHALL not call the delete BFF
- **AND** SHALL leave the project library unchanged

#### Scenario: Delete failure

- **WHEN** the user confirms delete and the BFF delete fails
- **THEN** the application SHALL show a safe error message
- **AND** SHALL keep the project listed until a later successful delete
