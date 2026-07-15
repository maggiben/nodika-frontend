# Testing and Quality Tooling

## Purpose

Validate changes with the repository’s Vitest, ESLint, Prettier, TypeScript, and Next production-build tooling.

## Responsibilities

- Add unit tests beside source as `src/**/*.test.ts(x)` or `src/**/*.spec.ts(x)`.
- Run the narrowest relevant checks locally, then the full build for route/config changes.
- Keep Vitest in its current Node environment unless browser interaction tests justify adding a DOM test stack.

## Inputs and outputs

Input: changed behavior. Output: focused tests plus reproducible command results.

## Best practices

- Test observable behavior and pure logic; avoid snapshot-only coverage.
- Use `npm test`, `npm run lint`, `npm run format:check`, and `npm run build`.
- Remove `--passWithNoTests` from `test` only after real test coverage makes an empty suite a failure worth enforcing.

## Common mistakes

- Writing JSX tests while `vitest.config.mts` uses `environment: "node"` without adding a DOM environment and renderer.
- Assuming `npm audit fix --force` is a harmless quality fix.
- Skipping `next build` after changing `next.config.ts` or routing.

## Example

```ts
import { expect, test } from "vitest";
test("formats a label", () => expect("Nodika").toBe("Nodika"));
```

## Related files

`vitest.config.mts`, `eslint.config.mjs`, `.prettierrc.json`, `package.json`
