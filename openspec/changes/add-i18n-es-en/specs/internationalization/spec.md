## ADDED Requirements

### Requirement: Spanish and English locales

The application SHALL support Spanish (`es`) as the default locale and English (`en`) as an alternate locale, with locale-prefixed App Router pages.

#### Scenario: Opening a path without a locale prefix

- **WHEN** a user requests a page path that does not begin with a supported locale
- **THEN** the application SHALL redirect to the same path prefixed with a locale
- **AND** SHALL use `es` when no persisted locale preference exists

#### Scenario: Rendering a localized page

- **WHEN** a user opens `/es` or `/en` (or a nested localized route)
- **THEN** user-facing chrome and page copy SHALL come from that locale’s dictionary
- **AND** the document language SHALL reflect the active locale

### Requirement: Language switching

Authenticated and unauthenticated users SHALL be able to switch between Spanish and English from the shared application shell.

#### Scenario: Switching language from the navbar

- **WHEN** a user selects English or Spanish in the language control
- **THEN** the application SHALL navigate to the equivalent path under that locale
- **AND** SHALL persist the preference for subsequent visits without a locale prefix
