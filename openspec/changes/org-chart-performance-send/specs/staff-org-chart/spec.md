## MODIFIED Requirements

### Requirement: Performance question message draft

The org-chart editor SHALL let the user prepare a message that asks the lead about each report’s performance, edit that draft, and send it to the lead’s WhatsApp when a phone number is available.

#### Scenario: Draft lists every report

- **WHEN** the lead has one or more reports and the user requests a performance message draft
- **THEN** the UI SHALL show a draft body that names the lead and each report (including role)
- **AND** SHALL let the user edit the draft text before copying or sending
- **AND** SHALL provide a Copy action for that draft

#### Scenario: Empty chart draft

- **WHEN** the lead has zero reports
- **THEN** the UI SHALL explain that reports are required before drafting a performance message
- **AND** SHALL not imply a send succeeded

#### Scenario: Send draft to lead phone

- **WHEN** the lead has a phone number and the user activates Send with a non-empty performance draft
- **THEN** the app SHALL deliver that draft text to the lead’s phone through the existing authenticated messaging test-send BFF using free-text (not a saved template key)
- **AND** SHALL show success or failure feedback without inventing a new frontend API route

#### Scenario: Send blocked without phone or draft

- **WHEN** the lead has no phone, or the draft text is empty
- **THEN** the UI SHALL NOT call the send API
- **AND** SHALL keep Copy available when a draft exists
