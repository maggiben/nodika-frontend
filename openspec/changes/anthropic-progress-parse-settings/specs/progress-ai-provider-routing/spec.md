## ADDED Requirements

### Requirement: Anthropic parse utility gated by account settings

When Core parses inbound progress replies, it SHALL resolve the account `progressAi` preference and SHALL invoke the Anthropic parsing utility only when that preference selects Anthropic. LLM API keys SHALL remain server-side only.

#### Scenario: Anthropic selected and key present

- **WHEN** an inbound progress reply is parsed
- **AND** the account `progressAi.provider` is `"anthropic"`
- **AND** `ANTHROPIC_API_KEY` is configured
- **THEN** Core SHALL call the Anthropic progress-parse utility with the account model (or `ANTHROPIC_PROGRESS_MODEL` when model is unset)
- **AND** SHALL NOT call OpenAI for that parse

#### Scenario: Anthropic selected but key missing

- **WHEN** an inbound progress reply is parsed
- **AND** the account `progressAi.provider` is `"anthropic"`
- **AND** `ANTHROPIC_API_KEY` is not configured
- **THEN** Core SHALL fail closed (return no parsed progress)
- **AND** SHALL NOT fall through to OpenAI for that request

#### Scenario: OpenAI selected or preference unset

- **WHEN** an inbound progress reply is parsed
- **AND** `progressAi` is unset or `provider` is `"openai"`
- **THEN** Core SHALL use the OpenAI progress-parse path when `OPENAI_API_KEY` is configured
- **AND** SHALL NOT call the Anthropic utility

#### Scenario: Shared parsed shape

- **WHEN** either provider succeeds
- **THEN** the result SHALL normalize to the same structured progress fields (`percent`, optional `duration` / `avance` / `notes` / `byRole`, and `model`)
