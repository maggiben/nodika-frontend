## Context

Upload already writes `SourceOfTruth` in Core MongoDB and sets `Account.activeProjectId`. The dashboard still reads a parallel `localStorage` library (`nodika.projectLibrary.v1`), which was a stopgap while Core lacked a list/read API for sources.

## Goals / Non-Goals

**Goals:**

- Dashboard + navbar project selector read projects from Core.
- Remove snapshot JSON persistence from `localStorage`.
- Keep selection via existing `PATCH /api/settings` `{ activeProjectId }`.

**Non-Goals:**

- Editing snapshots in the UI.
- Multi-account sharing of sources beyond what Core already stores.
- Keeping a durable offline cache.

## Decisions

1. **Source of truth** — MongoDB `SourceOfTruth` via Core `GET /sources` (latest document per `projectId`, including `content`).
2. **BFF** — Frontend `GET /api/snapshots` proxies that list with the session cookie (same auth pattern as upload).
3. **Client store** — In-memory React store loaded from `GET /api/snapshots` + `activeProjectId` from settings. No `localStorage` for snapshot JSON. Optional: keep nothing; refetch on mount / after upload / after select.
4. **Selection** — Navbar select and post-upload continue to call `activateActiveProject`; dashboard uses that id to pick the matching Core source.
5. **Upload response** — Prefer using Core upload `projectId` when present; otherwise derive from snapshot `meta.projectId`.

## Risks / Trade-offs

- [Empty UI until Core list ships] → Ship Core `GET /sources` in the sibling change first or in the same deploy window.
- [Large payloads] → Acceptable under existing 5 MiB upload cap; list returns one latest doc per project.
- [Legacy localStorage leftovers] → Harmless; stop reading/writing those keys (optionally clear once on load).

## Migration Plan

1. Deploy Core list endpoint.
2. Deploy frontend BFF + consumers; remove localStorage module usage.
3. Users re-see projects from Mongo without re-upload if sources still exist.
