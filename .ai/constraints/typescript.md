# TypeScript Constraints

- Never use `any`, `@ts-ignore`, or unreviewed type assertions to bypass a failure.
- Keep `strict` compatibility; it is enabled in `tsconfig.json`.
- Type component props and React Hook Form values explicitly.
- Validate unknown runtime data before treating it as a typed value.
- Preserve the `@/*` alias mapping to `src/*`; use relative imports only when local clarity is better.
