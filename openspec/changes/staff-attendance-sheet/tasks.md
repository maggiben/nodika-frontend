## 1. Domain module

- [x] 1.1 Add `src/lib/staff-attendance.ts` with status enum (`full_day` | `half_day` | `absent` | `justified`), localStorage store, get/set/clear mark, month day list, summarize tallies, and CSV builder (including orphan report ids)
- [x] 1.2 Add `src/lib/staff-attendance.test.ts` covering parse/persist round-trip, month history retention, tallies, search filter helpers, and CSV content

## 2. Attendance UI and route

- [x] 2.1 Add authenticated page `src/app/[locale]/staff/[contactId]/attendance/page.tsx` mirroring org-chart auth redirect
- [x] 2.2 Build `StaffAttendanceSheet` Client Component: month picker, MUI Data Grid (people × days), mark editors, empty-team state, helper note about browser-local history
- [x] 2.3 Wire search box + live tallies (full / half / absent / justified) for the filtered month rows
- [x] 2.4 Wire monthly CSV download action that does not clear storage

## 3. Org-chart entry and i18n

- [x] 3.1 Add navigation control on `StaffOrgChartEditor` to the attendance route for the same `contactId`
- [x] 3.2 Add en/es dictionary strings for sheet title, marks, search, tallies, export, empty team, and storage note; extend breadcrumbs if required by existing staff sub-route patterns
- [x] 3.3 Add focused component/route tests for navigation link and critical sheet behaviors where practical

## 4. Validation

- [x] 4.1 Run `npm run spec:validate`
- [x] 4.2 Run `npm test`, `npm run lint`, `npm run format:check`, and `npm run build`
