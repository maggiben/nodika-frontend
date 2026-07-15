# Project Library

## Purpose

Persist multiple uploaded Nordika snapshot projects in the browser and track which project the dashboard should visualize.

## Requirements

### Requirement: Local multi-project snapshot library

The application SHALL persist uploaded snapshot JSON documents in a local multi-project library keyed by project identity, and SHALL retain a selected project id used by the dashboard.

#### Scenario: Upsert after successful upload

- **WHEN** an authenticated user successfully uploads a snapshot
- **THEN** the application SHALL add or replace that project in the local library
- **AND** SHALL set it as the selected project

#### Scenario: Selecting a stored project

- **WHEN** a user chooses a project from the navbar selector
- **THEN** the library SHALL update the selected project id
- **AND** the home dashboard SHALL visualize that project's snapshot

#### Scenario: Migrating a legacy single snapshot

- **WHEN** the local library is empty and a legacy single-snapshot value exists
- **THEN** the application SHALL import it as one library entry and select it
