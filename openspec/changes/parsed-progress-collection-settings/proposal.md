## Why

Parsed inbound progress is embedded on messaging threads and only overlays snapshot `%` on the landing dashboard, so operators cannot measure **initial vs current** avance as explicit baseline/current/delta stats. Progress parsing is also OpenAI-only and env-pinned, with no operator control over OpenAI vs Anthropic or the model. We need a durable parsed-progress store, comparison-aware landing stats, and settings for provider + model.

## What Changes

- Depend on sibling **nodika-core** to persist each successful LLM parse into a **dedicated Mongo collection** (not only embedded on `StaffMessage`), and to aggregate comparison-ready progress from that collection.
- Update landing-page dashboard stats to show **baseline** (snapshot `avance_base`), **current** (latest parsed progress), and **explicit deltas** for overall progress and matching task/role breakdowns.
- Extend account **settings** (UI + BFF ↔ Core) so operators choose **OpenAI or Anthropic** and select a **model** for progress parsing.
- Depend on Core to run progress parsing against the selected provider/model using existing server-only API keys (`OPENAI_*` / `ANTHROPIC_*`).
- Keep browser → Next BFF → Core; no LLM calls or API keys in the frontend.

## Capabilities

### New Capabilities

- `progress-ai-settings`: Authenticated settings section to choose progress LLM provider (`openai` | `anthropic`) and model, persisted via BFF to Core account settings.
- `obra-progress`: Promote/extend live obra progress consumption so progress is pulled from Core’s dedicated parsed-progress collection for comparison stats (baseline vs current), while keeping navbar chip and BFF proxy behavior.

### Modified Capabilities

- `project-dashboard`: Landing stats show baseline, current, and delta values when live parsed progress is available; retain snapshot-only fallback when it is not.

## Impact

- Frontend: settings form + types, settings BFF PATCH shape, `obra-progress` client parse/merge, `project-dashboard` comparison UI, i18n, Vitest.
- Core (sibling `nodika-core`, implemented alongside): dedicated parsed-progress collection + write path, Anthropic provider support, account settings fields for provider/model, progress GET reads collection for aggregation/comparison payloads.
- Env (Core only): existing `OPENAI_API_KEY` / `OPENAI_PROGRESS_MODEL` and `ANTHROPIC_API_KEY` / `ANTHROPIC_PROGRESS_MODEL`; account settings override model/provider per operator account when set.
- Non-goals: calling OpenAI/Anthropic from the browser; inventing unrelated product analytics; mutating stored snapshot JSON as the source of “current.”
