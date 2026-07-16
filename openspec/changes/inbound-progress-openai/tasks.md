## 1. Types and BFF progress proxy

- [x] 1.1 Add typed `ObraProgress` model (overall %, byRole, reports) and a client/parser helper for Core progress payloads
- [x] 1.2 Add authenticated BFF route `GET /api/messaging/progress` that proxies Core `GET /messaging/progress?projectId=` via existing messaging session helpers
- [x] 1.3 Cover the BFF route with Vitest (401 without session; successful proxy shape)

## 2. Navbar progress chip

- [x] 2.1 Add `ObraProgressChip` Client Component that loads progress for the selected project (poll modestly when authenticated)
- [x] 2.2 Mount the chip beside `ProjectSelector` in `AppNavbar`
- [x] 2.3 Add ES/EN i18n strings for chip label, roles, and empty/unavailable states
- [x] 2.4 Add component tests for visible % vs hidden/empty when no live progress

## 3. Dashboard live overlay

- [x] 3.1 Extend dashboard model merge so objective-task `avance` and overall gauge prefer live progress when present
- [x] 3.2 Add/reuse a role breakdown chart when `byRole` has values
- [x] 3.3 Refetch/subscribe so changing the navbar project updates live charts
- [x] 3.4 Add unit/component tests for snapshot fallback and live overlay

## 4. Core cross-repo (nodika-core)

- [x] 4.1 Add OpenAI SDK + `OPENAI_API_KEY` / optional model env in nodika-core
- [x] 4.2 Parse meaningful inbound catalog / task-checklist replies into structured progress and persist
- [x] 4.3 Expose `GET /messaging/progress?projectId=` aggregating overall + byRole + reports
- [x] 4.4 Document Core env vars and cover parse/aggregate with unit tests

## 5. Validation

- [x] 5.1 Run `npm run spec:validate`, lint, tests, and production build for the frontend change
- [x] 5.2 Update README env notes only if needed for the BFF progress route (no OpenAI key on frontend)
