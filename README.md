# Nodika Frontend

Next.js BFF (backend-for-frontend) for Nodika: auth session cookies, project dashboards, snapshot upload, and staff WhatsApp messaging UI. The browser talks only to this app; server routes proxy to **nodika-core**.

```text
Browser → nodika-frontend (Next.js /api/*) → nodika-core (NestJS) → MongoDB / Redis / Resend / Evolution
```

| Area | Stack |
| --- | --- |
| Runtime | Node.js 20+ (22 used in Docker / Railway) |
| App | Next.js 16, React 19, TypeScript |
| Package manager | **npm** (`package-lock.json`) |
| UI | MUI 9, MUI X Data Grid / Charts |
| Deploy | [Railway](https://railway.com) via Docker (`Dockerfile` + `railway.toml`) |
| Specs | [OpenSpec](https://github.com/Fission-AI/OpenSpec) under `openspec/` |

Sibling API: [nodika-core](https://github.com/maggiben/nodika-core) — required for auth, sources, and messaging. That repo has its own README for Core / Railway / Mongo.

---

## Table of contents

- [Dependencies](#dependencies)
- [Prerequisites](#prerequisites)
- [Run locally](#run-locally)
- [Debug](#debug)
- [Deploy on Railway](#deploy-on-railway)
- [Environment variables](#environment-variables)
- [Scripts reference](#scripts-reference)
- [Project layout](#project-layout)
- [Contributing](#contributing)

---

## Dependencies

### Required to run this app

| Dependency | Purpose | Notes |
| --- | --- | --- |
| **Node.js** ≥ 20 | Runtime | Docker image uses Node 22; local often 22–24 |
| **npm** | Install & scripts | Prefer the lockfile with `npm ci` |
| **nodika-core** | Auth, sources, staff messaging API | Running Core URL in `NODIKA_CORE_URL` |

Without `NODIKA_CORE_URL`, the UI can boot, but login, uploads, roster, and catalog will fail when they hit `/api/*`.

### Runtime / product dependencies (via Core)

These are **not** installed in this repo; Core must be configured for the feature to work end-to-end:

| Dependency | Needed for |
| --- | --- |
| MongoDB | Accounts, projects, messaging persistence |
| Resend | Email verification / password recovery |
| Evolution API (optional) | WhatsApp send / inbound webhooks |
| Redis (optional) | Core HTTP cache |

### Frontend libraries (high level)

| Package | Role |
| --- | --- |
| `next` / `react` / `react-dom` | App router, RSC, BFF routes |
| `@mui/material` + Emotion | UI shell and forms |
| `@mui/x-data-grid` / `@mui/x-charts` | Staff grids and dashboard charts |
| `react-hook-form` | Forms |
| CodeMirror (`@uiw/react-codemirror`) | JSON snapshot editor |
| Vitest + Testing Library | Unit / component tests |
| OpenSpec (`@fission-ai/openspec`) | Spec-driven change workflow |

---

## Prerequisites

```bash
node -v    # >= 20
npm -v
```

Have **nodika-core** running (local or Railway) before exercising auth or messaging:

```bash
# in nodika-core/
pnpm install
cp .env.example .env   # set MONGO_URI, JWT_SECRET, APP_URL, RESEND_*, …
pnpm run start:dev     # usually http://localhost:3000
```

Point this frontend’s `APP_URL` / Core CORS at the URL you will use for the browser (for example `http://localhost:3001` if you run Next on 3001).

---

## Run locally

### 1. Install

```bash
npm ci
# or: npm install
```

### 2. Configure environment

Create a local env file (never commit secrets):

```bash
# .env.local (preferred by Next.js) or export in your shell
NODIKA_CORE_URL=http://localhost:3000
```

| Variable | Local tip |
| --- | --- |
| `NODIKA_CORE_URL` | Public or loopback URL of Core. **Server-only** — do not use `NEXT_PUBLIC_NODIKA_CORE_URL`. |
| `PORT` | Optional; `next dev` defaults to `3000`. If Core already uses 3000, run Next on another port. |

Example with Core on 3000 and frontend on 3001:

```bash
NODIKA_CORE_URL=http://localhost:3000 npm run dev -- -p 3001
```

Open [http://localhost:3001](http://localhost:3001) (or 3000 if that port is free).

### 3. Auth / cookies note

Access and refresh tokens live only in `HttpOnly`, `Secure`, `SameSite=Lax` cookies set by BFF routes under `/api/auth/*`. They are never returned in JSON or read from client JS.

Because cookies are `Secure`, full browser sessions expect **HTTPS** in production. Locally, some browsers still allow `Secure` cookies on `localhost`; if login appears to succeed but the session vanishes, try HTTPS locally or temporarily verify Core/BFF logs.

Do not paste Core JWTs into the frontend. Snapshot and messaging calls use the access-token cookie; on Core `401` the BFF refreshes once via the refresh cookie and rotates both cookies.

### 4. Production-like local run

```bash
npm run build
npm run start
# PORT=3001 npm run start
```

### Use Railway variables against a local process

If this directory is linked to the Railway project:

```bash
railway link                 # once
railway run npm run dev      # injects service variables (including NODIKA_CORE_URL)
```

Careful: Railway’s `NODIKA_CORE_URL` is often the **private** hostname (`*.railway.internal`), which only resolves from inside Railway. For laptop work, override with a public/local Core URL:

```bash
NODIKA_CORE_URL=http://localhost:3000 railway run npm run dev
# or simply omit railway run and use .env.local
```

---

## Debug

### Next.js dev + React

```bash
npm run dev
```

Use the browser Network tab for `/api/*` (status, Set-Cookie, JSON errors). Server logs appear in the terminal running `next dev`.

### Attach Node inspector to Next

```bash
NODE_OPTIONS='--inspect' npm run dev
```

Then in Cursor / VS Code → **Run and Debug** → attach to port `9229`, or use a launch config:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Attach nodika-frontend",
      "port": 9229,
      "restart": true,
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Vitest current file",
      "runtimeExecutable": "npx",
      "runtimeArgs": ["vitest", "run", "${relativeFile}"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Debug unit tests

```bash
npm run test:watch
# or one file:
npx vitest run src/lib/staff-catalog.test.ts
```

### Common local failures

| Symptom | Likely cause |
| --- | --- |
| Auth / API “Core is temporarily unavailable” | Core down, wrong `NODIKA_CORE_URL`, or Core 5xx |
| Login OK but no session | `Secure` cookie / mixed HTTP–HTTPS mismatch |
| CORS errors in browser to Core | Browser must not call Core directly; fix BFF. If emails/CORS break, check Core `APP_URL` |
| Messaging send fails | Evolution not configured on Core; check Core logs |
| Port already in use | Another process on 3000 — use `-p 3001` |

### Railway runtime debugging

```bash
railway link                 # select nodika-frontend service
railway logs                 # runtime (stream)
railway logs --build -n 200  # last build
railway logs -n 200          # last N runtime lines
railway ssh                  # shell in the running container
railway metrics
railway deployment list
```

Build failures often show up under `npm run build` / TypeScript (`Failed to type check`). Reproduce with `npm run build` locally before redeploying.

| Symptom on Railway | Likely cause |
| --- | --- |
| Healthcheck fail on `/` | App not listening on `PORT`, or boot crash |
| Auth broken in prod | `NODIKA_CORE_URL` wrong, or not using private URL to Core |
| Frontend → Core timeout | Core service crashed; or used public URL instead of `http://nodika-core.railway.internal:<port>` |
| Cookie / login loops | `APP_URL` / public domain mismatch; cookies not `Secure` over HTTPS |

---

## Deploy on Railway

This service builds with the **Dockerfile** (`railway.toml` → `builder = "DOCKERFILE"`):

1. `npm ci`
2. `npm run build`
3. Production image runs `npm run start` (`next start`)

Railway injects `PORT`; Next.js listens on it. Healthcheck path: `/`.

### Architecture in the Nodika Railway project

Typical services in the same project (project name may still be `nodika-core`):

| Service | Role |
| --- | --- |
| `nodika-frontend` | This app (public domain) |
| `nodika-core` | Nest API (private + optional public) |
| MongoDB | Database plugin |
| `evolution-api` (optional) | WhatsApp gateway |

Frontend should call Core over the **private network**, for example:

```bash
NODIKA_CORE_URL=http://nodika-core.railway.internal:8080
```

Use Core’s private listen port (check Core service `PORT` / variables), not `localhost`.

Also set:

```bash
APP_URL=https://<your-frontend-public-domain>
```

so links and Core CORS align with the public site.

### One-time setup

1. Install the [Railway CLI](https://docs.railway.com/guides/cli):

   ```bash
   brew install railway
   # or: npm i -g @railway/cli
   ```

2. Log in and link:

   ```bash
   railway login
   railway whoami
   cd /path/to/nodika-frontend
   railway link    # project + environment + service: nodika-frontend
   ```

3. Set variables on **nodika-frontend**:

   ```bash
   railway variable set NODIKA_CORE_URL=http://nodika-core.railway.internal:8080
   railway variable set APP_URL=https://your-frontend.up.railway.app
   ```

4. Generate / confirm domain:

   ```bash
   railway domain
   ```

5. Ensure **nodika-core** has Mongo, `JWT_SECRET`, `APP_URL` (frontend public URL), Resend, and Evolution vars as needed (see Core README).

### Ongoing deploys

GitHub → Railway auto-deploy on push to the connected branch (usually `main`), or:

```bash
railway up                 # deploy cwd; streams logs
railway up --detach
railway redeploy
railway deployment list
railway service status
```

### Verify a deploy

```bash
curl -sI "https://$RAILWAY_PUBLIC_DOMAIN/" | head
railway logs -n 50
```

If the build fails, pull build logs:

```bash
railway logs --build -n 300
```

---

## Environment variables

| Variable | Required | Notes |
| --- | --- | --- |
| `NODIKA_CORE_URL` | Yes (for real features) | Absolute Core base URL. Server-only. On Railway prefer private hostname. |
| `APP_URL` | Recommended in prod | Public frontend URL (used with Core CORS / email links — set consistently on Core too). |
| `PORT` | No | Injected by Railway; default `3000` for `next start` / `next dev`. |
| `NODE_ENV` | No | `production` in the Docker runner stage. |

**Do not set** `NEXT_PUBLIC_NODIKA_CORE_URL`. Core must stay server-side.

---

## Scripts reference

| Script | What it does |
| --- | --- |
| `npm run dev` | Next.js turbo/dev server |
| `npm run build` | Production build + typecheck |
| `npm run start` | Serve `.next` production build |
| `npm run lint` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm test` | Vitest once |
| `npm run test:watch` | Vitest watch |
| `npm run test:coverage` | Vitest + coverage |
| `npm run spec:validate` | OpenSpec validate (`--all --strict`) |

---

## Project layout

```text
src/
  app/                 App Router pages + API BFF routes (auth, messaging, snapshots, …)
  components/          UI (navbar, staff catalog, dashboards, …)
  i18n/                Dictionaries (es/en) + dictionary provider
  lib/                 Shared clients, parsers, staff/messaging helpers
  theme/               MUI theme
openspec/
  specs/               Accepted behavior specs
  changes/             Proposed / in-flight changes
Dockerfile             Multi-stage Node 22 image for Railway
railway.toml           Docker builder, healthcheck, start command
.cursor/               OpenSpec agent skills / commands
AGENTS.md              Agent rules (Next version + OpenSpec workflow)
```

UI copy belongs in `src/i18n/dictionaries/{es,en}.json`. Server-only Core access goes through `src/lib/core-auth.ts` and `src/app/api/**`.

---

## Contributing

### Workflow

1. **Branch** from `main` (`feat/…`, `fix/…`).
2. **Spec first** for behavior changes (features, bug fixes that change contracts, migrations, upgrades, security):
   - Read `openspec/specs/<capability>/spec.md`
   - Unclear? `/opsx:explore`
   - Propose with `/opsx:propose` (proposal, design, tasks, delta spec)
   - Implement with `/opsx:apply`
   - `npm run spec:validate` → sync accepted deltas → archive when done
3. **Implement** only what the change asks for; match existing MUI / i18n / BFF patterns.
4. **Validate** before PR:

   ```bash
   npm run format:check
   npm run lint
   npm test
   npm run test:coverage
   npm run build
   npm run spec:validate   # if you touched openspec/
   ```

5. Open a PR with a short **why**, how to test, and any env impact (`NODIKA_CORE_URL`, Core deploy order, etc.).

### Conventions

- TypeScript; prefer existing file/folder layout under `src/`.
- Keep Core secrets and tokens off the client; extend BFF layers instead of calling Core from the browser.
- Add or update Vitest tests next to non-trivial `lib/` helpers and API routes.
- Use both `es` and `en` dictionary keys for user-visible strings.
- Read local Next docs under `node_modules/next/dist/docs/` when APIs differ from older Next versions (`AGENTS.md`).
- Do not invent frontend specs for systems that are Core-only (DB schemas, Evolution internals, Railway infra) unless the change is about how this BFF uses them.

### What to test

| Layer | Where | Focus |
| --- | --- | --- |
| Lib / parsers | `src/lib/*.test.ts` | Pure helpers (catalog, roster, auth helpers) |
| API routes | `src/app/api/**/*.test.ts` | Cookie / proxy behavior with mocked `fetch` |
| Components | Testing Library where valuable | Critical UI flows |
| Coverage | `npm run test:coverage` | Meet the gate in `openspec/specs/test-coverage-gate` |

### Related Core work

If your change needs API support, land Core first (or in the same release window), set/adjust Railway vars, then deploy frontend. See the Core README for Mongo, JWT, Resend, Evolution, and `pnpm` workflows.

### Questions

- Agent / OpenSpec rules: [`AGENTS.md`](./AGENTS.md)
- Cursor skills: [`.cursor/skills/`](./.cursor/skills/)
- Railway CLI: https://docs.railway.com/guides/cli
- Next.js: https://nextjs.org/docs

---

## License

Private. Do not publish or redistribute without Nodika authorization.
