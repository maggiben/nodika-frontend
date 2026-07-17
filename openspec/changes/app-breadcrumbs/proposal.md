## Why

Nested app routes such as staff → org chart are hard to leave without hunting for back links or the navbar brand. A shared breadcrumb trail makes it obvious how to return to Home or a parent section from any authenticated page.

## What Changes

- Add a shared breadcrumb trail below the navbar on authenticated app routes.
- Derive trail segments from the current locale-prefixed pathname (Home → section → optional detail).
- Make ancestor segments clickable links; keep the current page as non-link text.
- Hide breadcrumbs on public auth routes (login, register, forgot/reset password, verify email) and on Home itself when the trail would be only Home.
- Replace the org-chart page’s ad-hoc “back to roster” button once breadcrumbs cover Staff as a parent.
- Add English and Spanish labels for breadcrumb segments.

## Capabilities

### New Capabilities

### Modified Capabilities

- `application-shell`: Add shared breadcrumb navigation under the navbar for localized app routes.
- `internationalization`: Add breadcrumb label keys for Home and known route segments.

## Impact

- Locale layout (`src/app/[locale]/layout.tsx`) and new breadcrumb UI/helpers under `src/components` / `src/lib`
- i18n dictionaries (`en.json`, `es.json`)
- Org chart editor: remove the ad-hoc back-to-roster control once shell breadcrumbs cover Staff
- Application shell and internationalization specs
