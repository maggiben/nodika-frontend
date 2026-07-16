## 1. Core: Anthropic utility and settings-gated routing (nodika-core)

- [x] 1.1 Add `getAnthropicConfig` (mirror OpenAI) reading `ANTHROPIC_API_KEY` / `ANTHROPIC_PROGRESS_MODEL`; unit-test missing key → null
- [x] 1.2 Add Anthropic progress-parse utility/adapter sharing the OpenAI JSON schema + `normalizeParsed` path
- [x] 1.3 Extend account settings schema/DTO with optional `progressAi: { provider, model }`; validate allowlisted models on PATCH
- [x] 1.4 In `ProgressParseService`, resolve account `progressAi` at parse time: call Anthropic only when `provider === "anthropic"`; OpenAI when unset/`openai`; fail closed if selected provider key missing (no cross-provider fallback)
- [x] 1.5 Unit tests for Anthropic-selected + key present, Anthropic-selected + key missing, OpenAI/unset paths, and shared result shape

## 2. Frontend: progress AI settings

- [x] 2.1 Extend `AccountSettings` / `isAccountSettings` for optional `progressAi` (`openai` | `anthropic` + model string)
- [x] 2.2 Add curated provider/model allowlists and settings form section (provider + model that resets on provider change)
- [x] 2.3 Wire save via existing `/api/settings` PATCH; show success/error without exposing API keys
- [x] 2.4 Add ES/EN i18n for progress AI settings labels and errors
- [x] 2.5 Vitest coverage for settings type guard and save payload shape

## 3. Validation

- [x] 3.1 Run frontend `npm run spec:validate`, format/lint, tests, and production build
- [x] 3.2 Run nodika-core unit tests for Anthropic config, provider routing, and `progressAi` settings
- [x] 3.3 Update Core README env notes only if Anthropic + settings behavior needs operator-facing clarification (keys stay server-side)
