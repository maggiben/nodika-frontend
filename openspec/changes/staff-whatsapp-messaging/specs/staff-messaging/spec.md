## ADDED Requirements

### Requirement: Staff WhatsApp page

Authenticated users SHALL manage staff WhatsApp contacts and status message templates from a localized Staff page linked in the avatar menu.

#### Scenario: Opening Staff from the avatar menu

- **WHEN** an authenticated user opens the avatar menu and chooses Staff
- **THEN** the application SHALL navigate to `/[locale]/staff`

#### Scenario: Saving a staff contact

- **WHEN** a user adds a WhatsApp phone and area label and saves
- **THEN** the BFF SHALL persist the contact through Core messaging

#### Scenario: Editing a template with interpolation

- **WHEN** a user edits a template body using tokens such as `{{duration}}` and `{{avance}}`
- **THEN** the page SHALL show a legend explaining each supported token
- **AND** the BFF SHALL persist the template through Core

#### Scenario: Sending a test WhatsApp message

- **WHEN** a user chooses a contact and presses the test button
- **THEN** the BFF SHALL request a Core test-send for that phone
- **AND** the UI SHALL report success or failure safely

### Requirement: Avatar email initials for signed-in users

The navbar avatar SHALL show the first two letters of the signed-in account email without requiring a fresh login after deploy.

#### Scenario: Signed-in user without email cookie

- **WHEN** an authenticated page loads and the email cookie is missing
- **THEN** the navbar SHALL resolve the email from `/api/settings`
- **AND** SHALL render initials from that email
