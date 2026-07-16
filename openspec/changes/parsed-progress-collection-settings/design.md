## Context

Today Core parses inbound WhatsApp progress with OpenAI and embeds `parsedProgress` on outbound `StaffMessage`. The frontend BFF proxies `GET /messaging/progress`, overlays live `%` onto snapshot tasks, and shows a navbar chip. There is no dedicated parse collection, no Anthropic path (keys exist only as Core env placeholders), no account-level provider/model settings, and no explicit baseline-vs-current-vs-delta presentation on the landing dashboard.

Constraints: LLM keys stay on Core; frontend uses session-auth BFF only; snapshot JSON in localStorage remains the structural baseline (`avance_base`); Client Components own settings form and dashboard interactivity.

## Goals / Non-Goals

**Goals:**

- Persist every successful structured parse into a dedicated Core Mongo collection and use that collection as the source for progress aggregation.
- Support OpenAI and Anthropic for progress parsing, driven by account settings (provider + model) with env key fallbacks.
- Expose settings UI + BFF to read/update provider and model.
- On the landing dashboard, show baseline, current, and delta for overall progress and for matching task (and role when available) stats.
- Keep degraded UX when provider keys are missing or no parses exist (snapshot-only; no invented %).

**Non-Goals:**

- Calling OpenAI/Anthropic from Next.js or the browser.
- Replacing snapshot upload as the structure source.
- Full model-catalog browsing from provider APIs (use a curated selectable list + optional free-text model id if Core accepts it).
- Historical time-series charts beyond latest-vs-baseline comparison for this change.

## Decisions

### 1. Dedicated parsed-progress collection in Core

- **Choice:** Core adds a `ParsedProgressReport` (name TBD in Core) collection with one document per successful parse: `projectId`, `contactId`, `taskId?`, `messageId` / thread refs, structured fields (`percent`, optional `duration`/`avance`/`notes`/`byRole`), `provider`, `model`, `parsedAt`, optional raw reply excerpt if already stored elsewhere is sufficient without duplicating PII unnecessarily.
- **Why:** User asked for its own collection so comparison stats are queryable independent of message document shape and survive clearer analytics reads.
- **Also:** Keep embedding `parsedProgress` on the outbound message for backward compatibility with the current messaging thread view, **or** write-only to the new collection and keep aggregation reading the collection. Prefer **write to new collection as source of truth** and stop relying on embedded fields for `GET /messaging/progress` aggregation (optional dual-write during migration).
- **Alt rejected:** Frontend localStorage of parses — not multi-device, not authoritative.

### 2. Progress API extends comparison fields (same BFF path)

- **Choice:** Keep `GET /api/messaging/progress?projectId=` as the single client fetch. Core aggregation reads the dedicated collection (latest per `contactId::taskId` or equivalent) and returns the existing payload **plus** optional comparison helpers if useful (`reports[].percent`, `overallPercent`). Baseline remains computed on the **frontend** from the selected snapshot’s `avance_base` (structure lives in the browser library). Frontend merge computes:
  - **baselineOverall** = mean of objective `avance_base`
  - **currentOverall** = live `overallPercent` when usable, else overlaid task mean
  - **deltaOverall** = current − baseline
  - Per matching `taskId`: baseline = `avance_base`, current = report `percent`, delta = current − baseline
  - Role bars: current from live `byRole`; baseline omitted unless snapshot has role equivalents (it does not today) — show current + treat missing baseline as “no baseline” for roles
- **Why:** Avoid inventing a second BFF route; user wants comparison measured where stats already show.
- **Alt rejected:** New `/api/messaging/progress/comparison` until a real need for separated caching appears.

### 3. Provider + model on account settings

- **Choice:** Extend Core `GET/PATCH /account/settings` with:

  ```ts
  progressAi: {
    provider: 'openai' | 'anthropic';
    model: string; // selected chat model id
  }
  ```

  Frontend settings form: provider toggle/select; model select filtered by provider from a curated allowlist (OpenAI: e.g. `gpt-4o-mini`, `gpt-4o`; Anthropic: e.g. `claude-sonnet-4-5`, `claude-haiku-4-5` — exact ids matched to Core supported list). Defaults: `openai` + Core’s current default model env.
- **Parse path:** Core `ProgressParseService` reads the account (or workspace) setting for the project owner / request context; uses corresponding env API key; fails closed if that provider’s key is unset.
- **Why:** Matches user request for settings control without shipping keys to the client.
- **Alt rejected:** Global-only env switch without UI — operators cannot choose per account.
- **Security:** Never return API keys in settings payloads; only provider + model.

### 4. Anthropic parity in Core parse service

- **Choice:** Shared JSON schema / system prompt; OpenAI and Anthropic adapters behind one interface. Model string comes from account setting, falling back to `OPENAI_PROGRESS_MODEL` / `ANTHROPIC_PROGRESS_MODEL`.
- **Why:** Env placeholders already exist; user chose dual-provider support.
- **Alt rejected:** Frontend choosing provider but Core still always OpenAI.

### 5. Dashboard UI: baseline + current + delta

- **Choice:** Extend `project-dashboard` Client rendering:
  - Overall gauge area shows current % primary; secondary labels for baseline and signed delta (e.g. `72% · baseline 55% · +17`).
  - Objective task grid adds columns or cell adornments for baseline / current / Δ when a live report matches `taskId`.
  - Completed-at-100 and chip summaries use **current** values; optional delta chip near overall when live data exists.
- **Server vs Client:** Dashboard remains Client (already merges live progress). Comparison math in a pure lib (`compare-dashboard-progress.ts`) unit-tested.
- **Accessibility:** Delta text includes clear words (“baseline”, “change”), not color-only.
- **Alt rejected:** Delta-only indicators without showing absolute baseline/current.

### 6. Component boundaries

- Settings: keep `UserSettingsForm` Client; load/save via existing `/api/settings`.
- Progress fetch: existing `useLiveObraProgress` / BFF unchanged path.
- Pure merge/compare helpers in `src/lib/` for Vitest.

## Risks / Trade-offs

- **[Risk] Core not deployed with collection yet** → Frontend treats missing/unchanged API as overlay-only; comparison UI shows baseline + “no live current” without fabricated deltas.
- **[Risk] Dual-write inconsistency during migration** → Prefer collection as aggregation source; message embed optional; document one-way backfill from existing `parsedProgress` embeds once.
- **[Risk] Wrong Anthropic model id** → Curated list + Core validates; on invalid model, parse fails closed and logs; UI surfaces save validation from Core.
- **[Risk] Account settings vs multi-user obra** → Use settings of the authenticated operator triggering parse context (or project owner if Core already scopes messages that way); document if Core currently lacks per-project AI settings.
- **[Risk] Settings PATCH widens validator** → Frontend `isAccountSettings` must accept new field optionally for forward/back compat (optional `progressAi` until Core rolls out).

## Migration Plan

1. Core: collection + write path + dual-write/backfill from embedded `parsedProgress`; Anthropic adapter; account `progressAi`; aggregation from collection.
2. Frontend: settings UI + types; comparison labels on dashboard; tests.
3. Rollback: unset provider keys / revert Core parse write; frontend comparison degrades to snapshot-only when live payload empty.

## Open Questions

- None blocking for planning: collection name and exact model allowlist to be finalized in Core implementation to match current SDK model strings.
