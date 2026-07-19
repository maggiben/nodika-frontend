## 1. Domain module

- [x] 1.1 Add `src/lib/staff-attendance.ts` with status enum, tallies, CSV builder
- [x] 1.2 Add `src/lib/staff-attendance.test.ts` covering parse/tallies/CSV
- [x] 1.3 Switch module to Core-backed load/save via BFF; clear legacy localStorage key

## 2. Attendance UI and route

- [x] 2.1 Authenticated attendance page
- [x] 2.2 StaffAttendanceSheet Data Grid UI
- [x] 2.3 Search + tallies
- [x] 2.4 Monthly CSV export
- [x] 2.5 Load/save month marks through Core; surface load/save errors; update storage note i18n

## 3. Org-chart entry and i18n

- [x] 3.1 Navigation from org chart
- [x] 3.2 Dictionary + breadcrumbs
- [x] 3.3 Component tests
- [x] 3.4 Add BFF GET/PUT `/api/messaging/contacts/[id]/attendance` proxies
- [x] 3.5 Update tests for Core-backed persistence

## 4. Validation

- [x] 4.1 Run `npm run spec:validate`
- [x] 4.2 Run `npm test`, `npm run lint`, `npm run format:check`, and `npm run build`
