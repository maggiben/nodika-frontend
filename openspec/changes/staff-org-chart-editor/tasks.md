## 1. Org chart storage and messaging helpers

- [x] 1.1 Add `staff-org-chart` types + localStorage module (`nodika.staffOrgCharts.v1`) with read/upsert/remove, report count helpers, and cross-tab subscribe (mirror project-library patterns)
- [x] 1.2 Add localized performance-draft builder (lead + each report name/role) and unit tests for storage, counts, and draft text
- [x] 1.3 Confirm existing messaging test-send BFF body shape; wire optional send only if free-text (or equivalent) is already supported—otherwise keep Copy-only

## 2. Org chart editor route and UI

- [x] 2.1 Add auth-gated localized route `/[locale]/staff/[contactId]/org` with Server Component shell + Client Component editor (add/edit/remove reports, role select, team count, save feedback, local-storage notice)
- [x] 2.2 Add i18n keys for editor, roles (`operario` / `jornalero` / `otro`), empty states, draft/copy/send, and a11y labels (en + es)
- [x] 2.3 Resolve lead label/phone from roster/contacts for the route param; handle missing contact gracefully

## 3. Staff roster integration

- [x] 3.1 Add Edit action on the roster actions column that navigates to the org-chart route for that row
- [x] 3.2 Add team-size column bound to the local org-chart store (0 when empty); refresh after navigation / storage events
- [x] 3.3 On successful Remove contact, prune that contact’s org-chart entry from local storage

## 4. Validation

- [x] 4.1 Add/adjust component tests for Edit navigation, team-size display, and editor add/remove persist behavior
- [x] 4.2 Run `npm run format`, `npm run lint`, `npm run test:coverage`, `npm run build`, and `npm run spec:validate`
