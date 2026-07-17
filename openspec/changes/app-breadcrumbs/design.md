## Context

The locale layout already mounts a shared `AppNavbar` above page content. Nested routes such as `/{locale}/staff/[contactId]/org` only offer an ad-hoc back button inside the org-chart editor. There is no shared trail for returning to Home or parent sections.

## Goals / Non-Goals

**Goals:**

- Show a Material UI breadcrumb trail under the navbar on authenticated app pages with depth > Home.
- Encode known path segments (upload, settings, staff, org) to localized labels and locale-prefixed hrefs.
- Keep the current page as plain text; ancestors as links (Home always links to `/{locale}`).
- Hide the trail on public auth routes and when the user is already on Home.
- Remove the org-chart “back to roster” button once Staff appears as a parent crumb.

**Non-Goals:**

- Backend or middleware changes.
- Breadcrumbs on auth flows beyond hiding them.
- Dynamic project-name crumbs on Home (Home label stays static).
- Resolving contact display names asynchronously for the middle crumb (use a generic “Lead” / contact-id fallback if needed, or omit the dynamic middle segment and show Home → Staff → Org chart).

## Decisions

### 1. Mount in locale layout below the navbar

**Choice:** Client `AppBreadcrumbs` in `src/app/[locale]/layout.tsx` after `AppNavbar`, inside a `Container maxWidth="lg"`.

**Why:** One integration point; every page inherits the trail without per-page wiring.

**Alternatives:** Per-page crumbs (more duplication); only on nested routes via nested layouts (misses flat pages like `/settings`).

### 2. Pathname → trail via a pure helper

**Choice:** `buildBreadcrumbs(pathname, locale, t)` (or equivalent) in `src/lib/breadcrumb-routes.ts` maps segments after the locale to crumbs.

**Trail examples:**

| Path                       | Trail                    |
| -------------------------- | ------------------------ |
| `/{locale}`                | (hidden)                 |
| `/{locale}/upload`         | Home → Upload            |
| `/{locale}/settings`       | Home → Settings          |
| `/{locale}/staff`          | Home → Staff             |
| `/{locale}/staff/[id]/org` | Home → Staff → Org chart |
| `/{locale}/login` (etc.)   | (hidden)                 |

**Why:** Pure function is easy to unit-test; UI stays thin (MUI `Breadcrumbs` + `Link`).

**Alternatives:** Hard-code crumbs per page component (harder to keep consistent).

### 3. Skip contact-id as its own crumb

**Choice:** For `/staff/[contactId]/org`, do not show the raw contact id as a crumb. Trail is Home → Staff → Org chart.

**Why:** Contact labels load client-side from messaging state; showing ids is noisy. Staff link already returns to the roster.

**Alternatives:** Pass lead label from the editor into a breadcrumb context (extra complexity for little gain).

### 4. Auth routes hide breadcrumbs

**Choice:** Treat known public auth path segments (`login`, `register`, `forgot-password`, `reset-password`, `verify-email`) as no-trail.

**Why:** Auth forms are flat entry points; navbar already covers Sign in / Register.

### 5. i18n under `breadcrumb.*`

**Choice:** New keys such as `breadcrumb.home`, `breadcrumb.upload`, `breadcrumb.settings`, `breadcrumb.staff`, `breadcrumb.org`, plus `breadcrumb.ariaLabel` for the nav landmark.

**Why:** Semantics differ from `nav.brand` / menu action labels; keeps dictionaries explicit.

## Risks / Trade-offs

- **[Risk]** Unknown future routes show no useful trail or a raw segment → **Mitigation:** Helper only emits crumbs for known segments; unknown paths fall back to Home-only (hidden) or Home → last known parent if we extend later.
- **[Risk]** Duplicate navigation with navbar brand → **Trade-off:** Acceptable; breadcrumbs show hierarchy, brand is always Home.
- **[Risk]** Removing org back button confuses users briefly → **Mitigation:** Staff crumb is immediately above the page title in the same visual region.

## Migration Plan

1. Ship breadcrumbs + i18n.
2. Remove org-chart back button in the same change.
3. No data migration.

## Open Questions

None — contact-id crumb omission is decided above.
