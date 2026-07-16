## ADDED Requirements

### Requirement: Progress AI provider and model settings

Authenticated users SHALL configure which LLM provider and model Core uses for inbound progress parsing, via the settings page, without receiving API keys in the browser. Selecting Anthropic SHALL enable Anthropic-backed parsing on Core for that account.

#### Scenario: Loading progress AI settings

- **WHEN** an authenticated user opens the settings page
- **AND** Core returns account settings that include a progress AI preference
- **THEN** the settings UI SHALL show the current provider as either OpenAI or Anthropic
- **AND** SHALL show the current model for that provider

#### Scenario: Saving Anthropic selection enables Anthropic parsing preference

- **WHEN** the user selects provider Anthropic and an allowed Anthropic model
- **AND** saves progress AI settings
- **THEN** the BFF SHALL PATCH Core account settings with `provider: "anthropic"` and the chosen `model`
- **AND** SHALL NOT send or display API keys

#### Scenario: Saving OpenAI selection

- **WHEN** the user selects provider OpenAI and an allowed OpenAI model
- **AND** saves progress AI settings
- **THEN** the BFF SHALL PATCH Core account settings with `provider: "openai"` and the chosen `model`

#### Scenario: Model list follows provider

- **WHEN** the user changes the provider between OpenAI and Anthropic
- **THEN** the model selector SHALL update to models allowed for the newly selected provider
- **AND** SHALL select a default model for that provider if the previous model is not valid for it

#### Scenario: Settings unavailable while signed out

- **WHEN** an unauthenticated user navigates to settings
- **THEN** the application SHALL redirect to the localized login page
- **AND** SHALL NOT expose progress AI configuration controls
