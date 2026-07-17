## 1. Core-backed org chart client

- [x] 1.1 Refactor `staff-org-chart` types/helpers to parse `orgReports` from roster/contact JSON and drop `localStorage` as source of truth (clear legacy `nodika.staffOrgCharts.v1`)
- [x] 1.2 Add async load-from-roster / save-via `PATCH /api/messaging/contacts/:id` with in-memory store + subscribe (mirror `snapshot-storage` pattern)
- [x] 1.3 Update unit tests for parse, save payload shape (`orgReports` + optional `projectIds`), and legacy key clearing

## 2. Org chart editor: reports + projects

- [x] 2.1 Load lead + `orgReports` + `projectIds` from Core; remove local-only notice; show BFF save success/error copy in i18n
- [x] 2.2 Add multi-select of projects from the Core-backed project library; persist replace `projectIds` with reports on save
- [x] 2.3 Keep performance draft/copy behavior driven by Core-loaded chart

## 3. Staff roster and consumers

- [x] 3.1 Drive team-size column from Core-backed store / roster `orgReports` length; refresh after editor navigation
- [x] 3.2 On Remove contact, stop pruning localStorage charts (Core owns deletion with the contact)
- [x] 3.3 Ensure catalog draft helpers still accept chart objects loaded from Core

## 4. Validation

- [x] 4.1 Update component tests (editor save mocks PATCH; roster counts; project multi-select)
- [x] 4.2 Run `npm run format`, `npm run lint`, `npm test`, `npm run spec:validate`, and `npm run build`
