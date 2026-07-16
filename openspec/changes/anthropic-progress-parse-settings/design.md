## Context

Core `ProgressParseService` parses inbound WhatsApp progress with OpenAI only (`getOpenAIConfig` / `OPENAI_API_KEY`). Anthropic env placeholders (`ANTHROPIC_API_KEY`, `ANTHROPIC_PROGRESS_MODEL`) exist but are unused. Account settings expose language, email schedule, and `activeProjectId`—no progress AI preference. Frontend settings (`UserSettingsForm` Client Component, BFF `/api/settings`) already proxies GET/PATCH to Core.

Constraints: LLM keys stay on Core; frontend never calls Anthropic/OpenAI; Client Components own the settings form; existing BFF session auth only.

## Goals / Non-Goals

**Goals:**

- Anthropic parse utility/adapter with the same structured JSON output as OpenAI.
- Provider selection from account `progressAi`; invoke Anthropic **only when** settings select `provider: "anthropic"`.
- Settings UI + typed BFF payload for provider + model (no keys).

**Non-Goals:**

- Parsed-progress Mongo collection or GET aggregation changes.
- Landing dashboard baseline/current/delta comparison.
- Per-project AI settings (account-level only for this slice).
- Streaming, tool calling, or non-progress Anthropic usage.

## Decisions

### 1. Settings gate = provider select (not a separate boolean)

- **Choice:** `progressAi: { provider: 'openai' | 'anthropic'; model: string }`. Anthropic is “enabled” when `provider === 'anthropic'`. Unset `progressAi` → keep today’s OpenAI + env model behavior.
- **Why:** One control for both enablement and which API to call; avoids confusing “enabled Anthropic” + “provider OpenAI” combinations.
- **Alternatives:** Separate `anthropicEnabled` flag — rejected as redundant with provider.

### 2. Shared parse interface + Anthropic utility

- **Choice:** Extract a small provider interface (`parseProgress(input) → ParsedProgressResult | null`). OpenAI keeps current chat-completions path; Anthropic utility uses Messages API with forced JSON (system prompt identical; normalize via existing `normalizeParsed`).
- **Why:** Keeps `MessagingService` call sites stable; settings only change which adapter `ProgressParseService` picks.
- **Config:** `getAnthropicConfig()` mirrors `getOpenAIConfig()` (null when key missing → fail closed for that provider).

### 3. Resolve settings at parse time

- **Choice:** When inbound parse runs, load the account owning the project/message context; if `progressAi.provider === 'anthropic'`, call Anthropic utility with `progressAi.model` or `ANTHROPIC_PROGRESS_MODEL`; if `openai` or unset, OpenAI path.
- **Why:** Matches “check from setting if enabled” without a global process-wide client.
- **Fallback:** Invalid/unknown model → reject save at PATCH; at parse time unknown model → log + return null (fail closed).

### 4. Frontend boundaries

- **Server:** `/api/settings` continues to proxy; extend `AccountSettings` / `isAccountSettings` for optional `progressAi` (provider + non-empty model string; ignore unknown shapes).
- **Client:** `UserSettingsForm` adds a Progress AI section (provider select + model select filtered by allowlist). Save via existing PATCH. No Server Actions for LLM.
- **Allowlists (UI + Core):** OpenAI e.g. `gpt-4o-mini`, `gpt-4o`; Anthropic e.g. `claude-sonnet-4-5`, `claude-haiku-4-5` (ids aligned with Core).

### 5. Security / a11y / rollback / tests

- **Security:** Never return API keys in settings; BFF validates session only; Core validates allowlist on PATCH.
- **Accessibility:** Native/MUI selects with labels; errors announced via existing form error patterns.
- **Rollback:** Omit `progressAi` from account → OpenAI-only path restored; remove Anthropic env → Anthropic selection fails closed at parse.
- **Tests:** Core unit tests for routing (openai vs anthropic vs missing key); frontend Vitest for settings type guard and PATCH payload shape.

## Risks / Trade-offs

- **[Risk] Wrong Anthropic model id** → Curated allowlist + Core validation; parse fails closed.
- **[Risk] Account vs obra ownership ambiguity** → Use settings of the authenticated account tied to the message/project owner as Core already does for messaging; document if multi-user obra differs.
- **[Risk] Overlap with `parsed-progress-collection-settings`** → This change ships the slice first; the larger change should reuse rather than duplicate settings/provider tasks.
- **[Trade-off]** Documenting Core routing in frontend OpenSpec → acceptable as operator-facing + cross-repo contract; no new speculative endpoints beyond existing `/account/settings` and env keys.

## Migration Plan

1. Core: Anthropic config + adapter; `progressAi` on account; wire parse routing; tests.
2. Frontend: types, settings UI, i18n, tests.
3. Deploy Core before (or with) frontend so PATCH of `progressAi` is accepted.
4. Rollback: clear `progressAi` or redeploy prior Core; unset Anthropic key.

## Open Questions

- Exact Anthropic model allowlist ids vs Core’s supported set (confirm at apply time against Anthropic/Core docs).
- Whether parse context should prefer project-owner settings when staff parse for another user’s obra (default: account of message owner / existing Core pattern).
