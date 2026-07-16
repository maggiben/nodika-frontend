## Context

Operators already select an obra in the navbar and view snapshot-based charts on `/`. Staff WhatsApp replies land in Core as inbound `StaffMessage` / catalog / task-checklist threads with raw `replyBody`. Task-checklist design explicitly deferred parsing those free-text replies into percentages. This change closes that gap: Core uses OpenAI to structure progress; the frontend shows a navbar chip and refreshes dashboard visuals from that live data.

Constraints: OpenAI keys stay server-side on Core; the browser only talks to Next.js BFF routes; Client Components are limited to interactive navbar/dashboard pieces; existing `messaging-bff` session proxy patterns apply.

## Goals / Non-Goals

**Goals:**

- Persist structured progress parsed from meaningful inbound replies (OpenAI SDK in Core).
- Expose aggregated obra progress (overall + by role) via Core → BFF for the selected `projectId`.
- Show a compact progress chip next to the project selector.
- Merge live task/role progress into dashboard gauge/bars so charts update without re-upload.
- Keep degraded UX when OpenAI is unset or Core returns no reports (snapshot-only dashboard; chip hidden or empty).

**Non-Goals:**

- Calling OpenAI from the browser or from Next.js Route Handlers.
- Owning Evolution webhooks in the frontend.
- Building a full analytics product or editing raw reply text in UI.
- Replacing snapshot upload as the obra structure source (tasks still come from snapshot; live % overlays them).

## Decisions

### 1. Parse location = nodika-core + OpenAI SDK

- **Choice:** On meaningful inbound (catalog progress asks and `task_checklist` asks), Core calls OpenAI with a structured JSON schema (`percent` 0–100, optional `duration`, `avance`, `notes`, optional `byRole` breakdown, optional `taskPercent` when `taskId` is known). Persist on the outbound thread / progress record. Key: `OPENAI_API_KEY` (optional `OPENAI_PROGRESS_MODEL`, default a small chat model).
- **Why:** User approved Core ownership; messy Spanish field Spanish needs model cleaning; key must not ship to the client.
- **Alt rejected:** Frontend BFF OpenAI — duplicates secrets and couples UI deploys to model prompts.

### 2. Aggregation API = `GET /messaging/progress?projectId=`

- **Choice:** Core returns `{ projectId, overallPercent, byRole: { jefe_obra, operario, jornalero, otro }, reports[], updatedAt }`. BFF proxies as `GET /api/messaging/progress?projectId=` with the existing session cookie flow.
- **Why:** Matches project selector + activate-active-project model; one fetch for navbar + dashboard.
- **Alt rejected:** Scraping catalog list on the client — incomplete (no `replyBody` on catalog rows today) and would force OpenAI into the frontend.

### 3. Role mapping

- **Choice:** Core stores model-extracted `byRole` when the reply names roles/people; otherwise the reporting catalog contact contributes to `jefe_obra`. Frontend may refine labels using local org-chart reports when names match, but does not require org-chart for the chip to work.
- **Why:** Org charts are local-only today; Core cannot depend on them.
- **Alt rejected:** Require org-chart sync to Core before progress works.

### 4. Dashboard merge

- **Choice:** Client loads live progress for `selectedId`. For reports with `taskId`, overlay `percent` onto matching objective-task `avance`. Overall gauge prefers live `overallPercent` when reports exist; otherwise snapshot average. Role bar chart uses `byRole`.
- **Why:** User asked for chip + charts that update from inbound without discarding snapshot structure.
- **Alt rejected:** Mutating stored snapshot JSON in localStorage from replies — fights upload source-of-truth.

### 5. UI: navbar Chip (Client)

- **Choice:** Compact MUI `Chip` beside `ProjectSelector` showing overall %; tooltip/title lists role percentages. Poll or refetch on project change and on a modest interval while authenticated.
- **Why:** Matches requested navbar chip placement without crowding the bar.
- **Accessibility:** Chip has an accessible name via i18n; empty/unavailable states do not announce misleading %.

### 6. Security

- OpenAI key only on Core. BFF remains auth-gated. No progress bodies logged at info level with PII beyond existing messaging patterns. Fail closed to snapshot-only when Core/OpenAI errors (no fabricated %).

## Risks / Trade-offs

- **[Risk] OpenAI unavailable / misparse** → Store raw `replyBody` unchanged; leave `parsedProgress` null; chip omitted; dashboard stays snapshot-based; log Core warning.
- **[Risk] Core endpoint not deployed yet** → Frontend treats 404/501 as empty progress; feature still builds.
- **[Risk] Role attribution weak without org chart** → Default to jefe_obra for the reporting contact; document that richer byRole needs clearer inbound wording or later Core roster roles.
- **[Risk] Polling cost** → Interval ≥ 30s; fetch only when a project is selected and user is authenticated.
- **[Risk] Snapshot vs live conflict** → Prefer live for matching `taskId`; show both conceptually as “live overlay” not as a new upload.

## Migration Plan

1. Ship Core parse + `GET /messaging/progress` with `OPENAI_API_KEY` configured.
2. Ship frontend BFF + chip + dashboard merge.
3. Rollback: unset Core key (parse no-ops) and/or hide chip when API empty; no DB migration required on frontend.

## Open Questions

- None blocking (Core owns OpenAI; frontend consumes approved BFF contract above).
