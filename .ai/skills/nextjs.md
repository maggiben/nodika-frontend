# Next.js App Router

## Purpose

Implement routes and framework integration in this Next.js 16.2.10 application.

## Responsibilities

- Place routes, layouts, loading, error, and metadata files under `src/app/`.
- Keep server rendering as the default; introduce `"use client"` only for browser APIs, state, or event handlers.
- Preserve the Turbopack root setting in `next.config.ts`; it fixes the pnpm workspace-root inference failure.

## Inputs and outputs

Input: a route or framework behavior requirement. Output: typed App Router files and route-appropriate metadata.

## Best practices

- Read the installed Next 16 documentation before using unfamiliar APIs, as required by `AGENTS.md`.
- Export `Metadata` from layouts/pages where product metadata is known.
- Use `next/image` for local or remote images after configuring remote sources.

## Common mistakes

- Adding `"use client"` to a page that can remain a Server Component.
- Moving `src/app` outside the project root or deleting `turbopack.root`.
- Treating the starter’s `Create Next App` metadata in `src/app/layout.tsx` as production metadata.

## Example

```tsx
// src/app/example/page.tsx
export default function ExamplePage() {
  return (
    <main>
      <h1>Example</h1>
    </main>
  );
}
```

## Related files

`src/app/layout.tsx`, `src/app/page.tsx`, `next.config.ts`, `AGENTS.md`
