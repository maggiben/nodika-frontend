# Architecture and Folder Organization

```text
src/
  app/
    globals.css      document-level baseline styles
    layout.tsx       root document, Geist font setup, metadata
    page.tsx         current `/` route
  components/
    app-theme.tsx    shared Material UI theme and baseline styles
next.config.ts       Turbopack project-root configuration
vitest.config.mts    Node-test inclusion pattern
```

The App Router is the application boundary. Add route segments, layouts, error boundaries, and loading UI under `src/app/`. Do not create a service, API, database, authentication, or component-layer convention until a real product requirement establishes its contract.

Use Server Components for route and display work. Client Components should be a narrow leaf boundary for browser-only interactions, including React Hook Form controls. If shared application code becomes necessary, introduce a named `src/components`, `src/features`, or `src/lib` directory based on ownership, and document the chosen boundary here.

`next.config.ts` derives its own directory and sets `turbopack.root`. This must remain while the surrounding pnpm workspace can affect root inference.
