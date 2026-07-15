# Nordika Frontend Architecture

The application is a Next.js 16.2.10 App Router project rooted at `src/app`. `layout.tsx` owns the document shell, Geist fonts, global metadata, and the shared Material UI provider; `page.tsx` owns the current `/` route. Styling uses Material UI components and theme tokens. TypeScript is strict and `@/*` maps to `src/*`.

No server actions, route handlers, data layer, API client, authentication, database, queue, cache, Docker setup, CI workflow, or deployment manifest is present. Add those only when a real feature defines their boundary and update `.ai/docs/architecture.md` and the matching skill when doing so.

Turbopack is pinned to this project with `turbopack.root` in `next.config.ts`; this prevents pnpm workspace root inference failures.
