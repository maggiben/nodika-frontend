## MODIFIED Requirements

### Requirement: Account management user flows

The application SHALL provide accessible Material UI and React Hook Form pages for register, login, email verification, forgotten-password submission, and password reset. It SHALL provide a logout affordance for authenticated users. Account forms SHALL submit only to same-origin BFF routes and SHALL never collect or display Core tokens. After logout, the client SHALL navigate to the localized login page.

#### Scenario: Password reset flow

- **WHEN** a visitor submits a valid reset token and replacement password
- **THEN** the page SHALL submit the token and password to the reset BFF route
- **AND** SHALL show a success or safe failure message

#### Scenario: Logout

- **WHEN** an authenticated user invokes logout
- **THEN** the client SHALL call the BFF logout route
- **AND** the browser session cookies SHALL be cleared
- **AND** the client SHALL navigate to the localized login page
