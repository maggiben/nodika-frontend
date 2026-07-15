# Application shell (delta)

## MODIFIED Requirements

### Requirement: Shared application navbar

The application SHALL render a shared navbar from the locale layout on every localized route, including a Nordika brand mark, session-aware controls, and a project selector when locally stored projects exist. When authenticated, the avatar menu SHALL include a Settings action, an Upload snapshot action, and logout. Theme and language controls SHALL live on the settings page instead of the navbar.

#### Scenario: Authenticated navbar

- **WHEN** an authenticated user opens any localized application route
- **THEN** the navbar SHALL show an avatar with email-based initials
- **AND** the avatar menu SHALL include Settings, Upload snapshot, and Sign out
