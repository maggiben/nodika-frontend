## ADDED Requirements

### Requirement: Progress AI provider, model, and API keys

Authenticated users SHALL configure which LLM provider and model Core uses for inbound progress parsing, via the settings page. Users MAY also set OpenAI and Anthropic API keys in settings (write-only); keys also remain available via server environment variables as fallback. GET responses MUST NOT include raw API key values.

#### Scenario: Loading progress AI settings

- **WHEN** an authenticated user opens the settings page
- **AND** Core returns account settings that include a progress AI preference
- **THEN** the settings UI SHALL show the current provider as either OpenAI or Anthropic
- **AND** SHALL show the current model for that provider
- **AND** SHALL show whether each provider key is configured without displaying the secret

#### Scenario: Saving OpenAI selection

- **WHEN** the user selects provider OpenAI and an allowed OpenAI model
- **AND** saves progress AI settings
- **THEN** the BFF SHALL PATCH Core account settings with `provider: "openai"` and the chosen `model`

#### Scenario: Saving Anthropic selection

- **WHEN** the user selects provider Anthropic and an allowed Anthropic model
- **AND** saves progress AI settings
- **THEN** the BFF SHALL PATCH Core account settings with `provider: "anthropic"` and the chosen `model`

#### Scenario: Saving an API key

- **WHEN** the user pastes an OpenAI or Anthropic API key and saves
- **THEN** the BFF SHALL include that key in the PATCH body for Core
- **AND** after success the UI SHALL show the key as configured without displaying the full secret

#### Scenario: Blank key fields leave stored keys unchanged

- **WHEN** the user saves progress AI settings with blank key inputs
- **THEN** the BFF SHALL omit key fields so previously stored keys remain

#### Scenario: Model list follows provider

- **WHEN** the user changes the provider between OpenAI and Anthropic
- **THEN** the model selector SHALL update to models allowed for the newly selected provider
- **AND** SHALL select a default model for that provider if the previous model is not valid for it

#### Scenario: Settings unavailable while signed out

- **WHEN** an unauthenticated user navigates to settings
- **THEN** the application SHALL redirect to the localized login page
- **AND** SHALL NOT expose progress AI configuration controls
