# Naming Constraints

- Use PascalCase for React component names and files that export a primary component.
- Use descriptive camelCase for variables/functions and explicit domain names for types.
- Follow App Router reserved names exactly (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`).
- Avoid ambiguous `utils`, `helpers`, `data`, or `Props` catch-alls; name by responsibility.
- Co-locate tests as `*.test.ts(x)` or `*.spec.ts(x)` under `src/`, matching `vitest.config.mts`.
