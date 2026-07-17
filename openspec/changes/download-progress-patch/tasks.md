## 1. Patch builder

- [x] 1.1 Add `buildProgressPatchJson(snapshotJson, liveProgress)` that updates `avance_base` from report percents by `taskId`
- [x] 1.2 Add `downloadJsonFile(filename, jsonText)` helper for Blob + temporary anchor download
- [x] 1.3 Add Vitest coverage for overlay, no-reports passthrough, and invalid JSON handling

## 2. Avatar menu

- [x] 2.1 Add Download patch `MenuItem` in `AppNavbar` that fetches live progress, builds the patch, and downloads it
- [x] 2.2 Guard when no selected snapshot; close the menu after the action
- [x] 2.3 Add `nav.downloadPatch` (and any needed empty-state copy) to ES/EN dictionaries

## 3. Validation

- [x] 3.1 Run `npm run spec:validate`, `npm test`, and lint on touched files
