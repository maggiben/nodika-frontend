## Context

Project delete today:

1. Settings UI → `deleteStoredProject(projectId)`
2. BFF `DELETE /api/snapshots/[projectId]` → Core `DELETE /sources/:projectId`
3. Core `SourcesService.deleteByProjectId` only `deleteMany` on `SourceOfTruth`
4. Frontend refreshes the library and may re-point `activeProjectId`

WhatsApp / obra progress lives elsewhere in Core, mainly `StaffMessage` rows stamped with `projectId` (catalog sends, task-checklist asks, inbound replies with `parsedProgress`). Roster contacts also keep that id in `projectIds`. Catalog **message definitions** are account-scoped (not per-obra), but send progress is derived from message history (`lastSentAt`, open threads, checklist position).

Re-upload reuses snapshot `meta.projectId`, so leftover messages make the obra look already advanced.

## Goals / Non-Goals

**Goals:**

- After a successful project delete, that `projectId` has no residual send/checklist/parsed progress in Core.
- Re-uploading the same snapshot yields a blank progress slate (dashboard chip/gauge empty or snapshot-only; Mensajes del equipo show unsent state for that obra’s threads).
- Keep the frontend delete path as a single BFF DELETE; cascade inside Core’s existing delete.

**Non-Goals:**

- Deleting staff contacts or shared catalog message **templates**.
- Changing how upload derives `projectId` from the snapshot.
- Inventing a separate “reset progress” UI or public endpoint.
- Migrating historical messages for already-deleted projects (cleanup is on next delete only).

## Decisions

1. **Cascade inside Core `deleteByProjectId` (same HTTP contract)**  
   - **Choice:** After sources are removed, Core deletes messaging progress for that `projectId` and cleans contact membership.  
   - **Why:** Frontend already proxies this path; no new BFF surface; one atomic operator action.  
   - **Alternatives:** Separate `DELETE /messaging/progress?projectId=` called from frontend → two-phase failure modes; or mint a new `projectId` on each upload → breaks continuity of “same obra” and still leaves orphan history.

2. **Delete `StaffMessage` documents with matching `projectId`**  
   - **Choice:** `deleteMany({ projectId })` for that obra (outbound + inbound, all sources including `catalog`, `task_checklist`, `obra_adelanto`).  
   - **Why:** That collection is the source of `lastSentAt`, open threads, and `listObraProgress` aggregation via `parsedProgress`. Removing it resets WhatsApp send progress and live `%`.  
   - **Alternatives:** Soft-flag / archive → more complex and still risks leaking into aggregations if filters miss.

3. **Strip `projectId` from contacts; keep contacts and catalog definitions**  
   - **Choice:** `$pull` the deleted id from `projectIds` (and clear legacy singular `projectId` when it matches). Do **not** delete `StaffCatalogMessage` rows. Optionally clear `catalogSlotKey` / `catalogSlotStartAt` only when the contact no longer has any project membership (or always clear slot when the deleted id was their only/active obra—prefer clearing slot when membership becomes empty to avoid stale “open cycle” blocking).  
   - **Why:** Catalog copy is reusable; progress is per-obra message history + membership.

4. **Also clear any dedicated parsed-progress collection if present**  
   - **Choice:** If Core has (or gains) a separate progress collection keyed by `projectId` (see `parsed-progress-collection-settings`), delete those rows in the same cascade.  
   - **Why:** “Todo avance” must cover future aggregation source of truth, not only embedded `parsedProgress`.

5. **Cache invalidation**  
   - **Choice:** Invalidate Core cache paths for sources list and messaging progress for that `projectId` (and related messaging list caches if keyed).  
   - **Why:** Avoid serving stale progress after delete.

6. **Frontend behavior**  
   - **Choice:** No new client calls if Core cascades; add/adjust tests that mock empty progress after delete+reupload where useful; update specs. If Core cannot ship first, frontend MUST NOT pretend progress was cleared.  
   - **Why:** Progress is server-backed; browser has no localStorage progress store.

7. **Failure semantics**  
   - **Choice:** Prefer best-effort cascade after sources delete succeeds: if messaging cleanup fails, log and surface a safe error or still return success with documented risk—**prefer fail-closed**: if cascade fails after sources were deleted, return 5xx with a clear message so operators know progress may linger (and can retry cleanup / support). Exact Nest pattern left to Core implementer; document in Core tests.  
   - **Why:** Silent partial delete is how we got this bug.

## Risks / Trade-offs

- **[Risk] Partial delete (sources gone, messages remain)** → Mitigate with transactional-ish ordering: delete messages first then sources, or compensate + fail loudly; add Core integration test covering both collections.  
- **[Risk] Deleting messages for a shared phone across obras** → Messages are partitioned by `projectId`; only matching rows go. Contacts remain.  
- **[Risk] Catalog UI still shows old `lastSentAt` from cache** → Invalidate messaging caches; frontend remount/refetch on next Staff visit.  
- **[Risk] Frontend-only change cannot fix production** → Ship Core cascade before or with frontend; frontend change is mostly contractual/spec.

## Migration Plan

1. Implement and deploy Core cascade on `DELETE /sources/:projectId` with unit/integration tests.  
2. Deploy frontend (spec/docs/tests); BFF unchanged if contract holds.  
3. Rollback: redeploy prior Core (old behavior returns); no data migration required.  
4. Optional one-off: ops script to purge orphan `StaffMessage` for projectIds with no sources (out of scope for v1).

## Open Questions

- None blocking: “todo avance” includes WhatsApp send state, checklist threads, and live obra `%` (embedded or dedicated collection).
