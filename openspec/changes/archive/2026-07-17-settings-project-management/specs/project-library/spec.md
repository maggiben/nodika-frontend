## ADDED Requirements

### Requirement: Delete project from Core via BFF

The application SHALL allow removing a project from the Core-backed library by `projectId` through an authenticated BFF delete that proxies Core’s approved source-deletion endpoint. After a successful delete, the in-memory library MUST refresh from `GET /api/snapshots`. When the deleted `projectId` was the account `activeProjectId`, the application SHALL update account settings so `activeProjectId` is either another remaining listed project or cleared.

#### Scenario: Successful delete refreshes library

- **WHEN** an authenticated client deletes a `projectId` via the BFF
- **AND** Core accepts the deletion
- **THEN** the application SHALL refresh projects from the BFF snapshot list
- **AND** that `projectId` SHALL no longer appear in the library

#### Scenario: Deleted active project

- **WHEN** the deleted `projectId` matches the current `activeProjectId`
- **AND** other projects remain in the library after refresh
- **THEN** the application SHALL PATCH account settings to a remaining listed `activeProjectId`

#### Scenario: Deleted last active project

- **WHEN** the deleted `projectId` matches the current `activeProjectId`
- **AND** no projects remain after refresh
- **THEN** the application SHALL clear `activeProjectId` in account settings

#### Scenario: Unauthenticated delete

- **WHEN** a client without a valid BFF session calls the delete endpoint
- **THEN** the route SHALL return 401
- **AND** SHALL not delete any Core source
