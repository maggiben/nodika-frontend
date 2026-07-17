## 1. Core dependency gate

- [x] 1.1 Confirm or propose sibling Core change for authenticated delete-by-`projectId` so the project disappears from `GET /sources` (blocks delete BFF/UI until approved)
- [x] 1.2 Record the approved Core delete path/shape in implementation notes once Core lands (do not invent a path)

## 2. Project library delete support

- [x] 2.1 Add authenticated BFF `DELETE` on the snapshots route that proxies Core’s approved source deletion by `projectId` (`project-library`: Delete project from Core via BFF)
- [x] 2.2 Add `deleteStoredProject` (or equivalent) in `snapshot-storage` that calls BFF delete, refreshes the library, and updates `activeProjectId` when the deleted project was active (`project-library` scenarios: Successful delete, Deleted active project, Deleted last active project)
- [x] 2.3 Unit-test library delete success, failure, active reassignment, and last-project clear

## 3. Settings Projects UI

- [x] 3.1 Add `SettingsProjectsPanel` (Client Component) listing library projects with name + id, empty state, and upload CTA navigating to `/{locale}/upload` (`settings-project-management`: Projects section; `snapshot-upload`: Settings entry)
- [x] 3.2 Compose the panel into `UserSettingsForm` / settings page
- [x] 3.3 Add delete control with confirmation dialog; wire to library delete helper; show safe errors on failure (`settings-project-management`: Delete project from settings)
- [x] 3.4 Add en/es i18n keys for section title, empty state, upload CTA, delete, confirm, and errors

## 4. Tests and validation

- [x] 4.1 Component tests for settings projects list, empty state, upload navigation, confirm/cancel delete, and delete error path
- [x] 4.2 BFF route tests for unauthenticated delete (401) and successful proxy when Core is available
- [x] 4.3 Run `npm run format`, `npm run lint`, `npm test`, `npm run spec:validate`, and `npm run build`
