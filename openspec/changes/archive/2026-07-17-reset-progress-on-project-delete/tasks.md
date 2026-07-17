## 1. Core sibling (nodika-core) — required for real reset

- [x] 1.1 Extend `SourcesService.deleteByProjectId` to delete all `StaffMessage` rows for the `projectId` (catalog, task_checklist, obra_adelanto, inbound/outbound)
- [x] 1.2 Strip the deleted id from contact `projectIds` / legacy `projectId`; clear catalog slot fields when membership becomes empty
- [x] 1.3 Delete any dedicated parsed-progress documents for that `projectId` if the collection exists
- [x] 1.4 Invalidate sources-list and messaging progress caches for that `projectId`
- [x] 1.5 Choose fail-closed ordering (cleanup before or compensated after source delete) and return a clear error if cascade fails
- [x] 1.6 Add Core unit/integration tests: delete with prior messages + progress → `listObraProgress` empty and no `lastSentAt` residue; re-create source with same id starts clean
- [x] 1.7 Deploy Core before relying on production reset behavior

## 2. Frontend BFF / client (nodika-frontend)

- [x] 2.1 Confirm `DELETE /api/snapshots/[projectId]` still proxies Core delete only (no speculative new endpoint unless Core requires it)
- [x] 2.2 Keep `deleteStoredProject` refresh + `activeProjectId` handling; document that progress reset is Core-side
- [x] 2.3 Add or extend a Vitest that documents expected empty progress after successful delete when Core returns success (mock BFF/Core as needed)
- [x] 2.4 Extend settings delete panel test coverage only if UI copy or error handling changes

## 3. Specs and validation

- [x] 3.1 Keep delta specs aligned with implemented Core behavior (`project-library`, `settings-project-management`)
- [x] 3.2 Run `npm run spec:validate`
- [x] 3.3 Run frontend lint/tests for touched files; run Core tests for delete cascade
- [x] 3.4 Manual smoke: send WhatsApp/catalog progress on an obra → delete project in Settings → re-upload same snapshot → confirm no prior send state and no live obra `%`
