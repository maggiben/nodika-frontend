# Architecture Constraints

- Keep application code under `src/`; routes belong under `src/app/`.
- Prefer Server Components. A `"use client"` directive needs a browser-only reason.
- Do not duplicate business logic between routes and Client Components; extract typed modules when logic becomes shared.
- Do not invent API routes, persistence, authentication, payments, or service layers: none exist in this repository today.
- Preserve `next.config.ts` `turbopack.root`; pnpm workspace inference otherwise fails during development.
