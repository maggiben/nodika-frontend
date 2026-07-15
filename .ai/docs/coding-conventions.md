# Coding Conventions

- TypeScript is strict (`tsconfig.json`); do not use `any` or error-suppression comments.
- Formatting is Prettier: two spaces, semicolons, double quotes, and trailing commas.
- ESLint combines Next Core Web Vitals, Next TypeScript rules, and Prettier compatibility.
- Use `@/` for source-root imports when crossing feature boundaries.
- Components are functions with precise prop types. Use Server Components unless browser behavior requires a Client Component.
- Styling uses Material UI. Use the shared `AppTheme`, Material UI components, and `sx` only for component-local adjustments; do not reintroduce Tailwind utilities.
- Tests live under `src/` and use `*.test.*` / `*.spec.*`.

The current `page.tsx` is scaffold content, not a product pattern for metadata, navigation, or external links. Replace it deliberately as feature requirements arrive.
