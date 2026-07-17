## 1. i18n labels

- [x] 1.1 Add `breadcrumb.home`, `breadcrumb.upload`, `breadcrumb.settings`, `breadcrumb.staff`, `breadcrumb.org`, and `breadcrumb.ariaLabel` to `en.json` and `es.json`

## 2. Breadcrumb helper and UI

- [x] 2.1 Add `src/lib/breadcrumb-routes.ts` that builds crumbs from locale-prefixed pathnames (hide Home-only and auth routes; map known segments; skip contact id on org chart)
- [x] 2.2 Add client `AppBreadcrumbs` using MUI `Breadcrumbs` + `next/link`, localized labels, and aria label
- [x] 2.3 Mount `AppBreadcrumbs` in `src/app/[locale]/layout.tsx` below `AppNavbar`

## 3. Org chart cleanup

- [x] 3.1 Remove the org-chart editor’s ad-hoc back-to-roster button (and unused i18n key if unused elsewhere)

## 4. Tests and validation

- [x] 4.1 Unit-test crumb building for Home, staff, org chart, settings/upload, and auth routes
- [x] 4.2 Component-test that breadcrumbs render links for ancestors and hide on Home/auth
- [x] 4.3 Update org-chart tests if they assert the back button
- [x] 4.4 Run `npm test`, `npm run lint`, `npm run format:check`, `npm run spec:validate`, and `npm run build`
