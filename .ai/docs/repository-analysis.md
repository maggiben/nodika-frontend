# Repository Analysis — 2026-07-14

## Current architecture

Nodika Frontend is a newly bootstrapped, single-route Next.js 16.2.10 application. The App Router lives at `src/app/`: `layout.tsx` supplies fonts, root HTML/body, and metadata; `page.tsx` is the only route. There are no route handlers, server actions, data-access modules, API clients, databases, auth providers, payment integrations, or shared component directories.

The parent repository contains a sibling `nodika-core` backend, but this frontend has no workspace link, shared contract, environment configuration, fetch call, or API client connecting to it. Treat any future integration as a new, explicitly documented server boundary.

## Libraries and conventions

- React 19.2.4 and strict TypeScript; `@/*` resolves to `src/*` (`tsconfig.json`).
- Material UI with Emotion provides the component system, theme, responsive layout, and feedback UI (`src/components/app-theme.tsx`).
- Geist/Geist Mono are loaded through `next/font/google` in the root layout.
- ESLint 9 with Next Core Web Vitals and TypeScript presets, with Prettier conflict rules disabled (`eslint.config.mjs`).
- Prettier uses two spaces, semicolons, double quotes, and trailing commas (`.prettierrc.json`).
- Vitest 4 runs matching tests under `src/` in Node; no tests currently exist (`vitest.config.mts`).
- React Hook Form is installed but not yet used (`package.json`).

## Patterns and anti-patterns

The home page uses Material UI layout and feedback components, a CodeMirror JSON editor, React Hook Form, and safe server-side forwarding to Core. The root provider applies Geist typography through the Material UI theme. Metadata remains create-next-app placeholder text and should be replaced before release.

## Technical debt and risks

1. No automated test coverage; the test script accepts an empty suite.
2. No product metadata, favicon/manifest policy, error/loading boundary, or deployment configuration.
3. No defined runtime validation strategy for future forms/API boundaries.
4. The repository is package-manager sensitive: `next.config.ts` pins `turbopack.root` to avoid a pnpm workspace inference failure.
5. Dependency audit output previously reported moderate findings; review the dependency tree before a release rather than forcing upgrades.
