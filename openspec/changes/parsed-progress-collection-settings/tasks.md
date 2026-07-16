## 1. Core: parsed-progress collection and providers (nodika-core)

- [ ] 1.1 Add a dedicated Mongo/Mongoose model for parsed progress reports (projectId, contactId, taskId?, message refs, percent/fields, provider, model, parsedAt)
- [ ] 1.2 On successful inbound parse, write to the new collection (and dual-write or migrate off embedded-only aggregation)
- [ ] 1.3 Point `GET /messaging/progress` aggregation at the dedicated collection (latest per contact/task)
- [ ] 1.4 Add Anthropic adapter alongside OpenAI behind a shared progress-parse interface; respect `OPENAI_*` / `ANTHROPIC_*` env keys
- [ ] 1.5 Extend account settings with `progressAi: { provider, model }`; use it when parsing; validate allowlisted models
- [ ] 1.6 Backfill existing embedded `parsedProgress` into the collection once; cover collection write, providers, and settings with Core unit tests

## 2. Frontend: progress AI settings

- [ ] 2.1 Extend `AccountSettings` types and `isAccountSettings` to accept optional `progressAi` (`openai` | `anthropic` + model string)
- [ ] 2.2 Add curated provider/model allowlists and settings form section (provider select + model select that resets on provider change)
- [ ] 2.3 Wire save via existing `/api/settings` PATCH to Core; show success/error without exposing API keys
- [ ] 2.4 Add ES/EN i18n for progress AI settings labels and errors
- [ ] 2.5 Add Vitest coverage for settings parsing and form save payload shape

## 3. Frontend: baseline vs current comparison on landing stats

- [ ] 3.1 Add pure compare helper (baseline from snapshot `avance_base`, current from live progress, deltas for overall + matching tasks)
- [ ] 3.2 Update `project-dashboard` overall stats UI to show baseline, current, and signed delta when live progress exists
- [ ] 3.3 Update objective task grid (or progress cells) to show baseline / current / Δ for tasks with matching live reports
- [ ] 3.4 Preserve snapshot-only fallback with no fabricated current/delta when live progress is empty
- [ ] 3.5 Add ES/EN strings for baseline, current, and delta labels
- [ ] 3.6 Add unit/component tests for comparison math and snapshot fallback

## 4. Validation

- [ ] 4.1 Run frontend `npm run spec:validate`, lint, tests, and production build
- [ ] 4.2 Run nodika-core tests for parse collection, provider selection, and account settings
- [ ] 4.3 Update README notes only if settings/progress behavior needs operator-facing docs (no LLM keys on frontend)
