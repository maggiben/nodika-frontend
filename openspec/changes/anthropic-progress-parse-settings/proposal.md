## Why

Inbound WhatsApp progress parsing in Core is OpenAI-only today, while `ANTHROPIC_*` env placeholders already exist and operators cannot choose Anthropic. We need a Core Anthropic parse utility that runs only when account settings select Anthropic as the progress AI provider, plus minimal frontend settings support to persist that choice—without the broader parsed-progress collection or dashboard comparison work tracked in `parsed-progress-collection-settings`.

## What Changes

- Add a Core Anthropic progress-parse adapter/utility behind the existing parse interface (shared JSON shape / system prompt with OpenAI).
- When parsing inbound progress, Core SHALL read account `progressAi` settings and use Anthropic **only when** `provider` is `"anthropic"` (and the Anthropic API key is configured); otherwise keep the OpenAI path / fail closed when the selected provider’s key is missing.
- Extend account settings (`GET`/`PATCH`) with optional `progressAi: { provider, model }` so operators can enable Anthropic (or OpenAI) and pick an allowlisted model.
- Frontend: accept and save `progressAi` via existing `/api/settings`, with a settings UI section for provider + model (Anthropic selectable when operators opt in).
- Non-goals: dedicated parsed-progress Mongo collection, landing baseline/current/delta stats, calling Anthropic/OpenAI from Next.js or the browser, inventing new BFF auth flows.

## Capabilities

### New Capabilities

- `progress-ai-settings`: Authenticated settings controls to choose progress LLM provider (`openai` | `anthropic`) and model; persisted via BFF to Core; no API keys in the browser.
- `progress-ai-provider-routing`: Core (sibling) behavior: resolve provider/model from account settings, invoke Anthropic parse utility only when Anthropic is selected and enabled via that setting, fall back to env defaults when unset.

### Modified Capabilities

- (none in main `openspec/specs/` — this slices provider routing + settings only; dashboard/progress UI requirements stay unchanged)

## Impact

- Frontend: `AccountSettings` / `isAccountSettings`, settings form + i18n, Vitest for settings shape; BFF `/api/settings` already proxies PATCH—extend payload typing only.
- Core (`nodika-core`): `ProgressParseService` multi-provider interface, Anthropic client utility, `getAnthropicConfig`, account DTO/schema for `progressAi`, allowlist validation, unit tests.
- Env (Core only, already documented placeholders): `ANTHROPIC_API_KEY`, `ANTHROPIC_PROGRESS_MODEL`; OpenAI envs unchanged.
- Overlap: intentionally narrower than `parsed-progress-collection-settings` (no collection, no comparison UI); that change can later absorb or depend on this slice.
