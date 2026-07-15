# Performance

## Purpose

Maintain fast App Router routes as this starter becomes an application.

## Responsibilities

Measure route behavior, preserve Server Components, optimize assets, and prevent unnecessary client bundles.

## Inputs / outputs

Input: measurable route or interaction slowdown. Output: baseline, focused change, post-change measurement, and trade-offs.

## Best practices

Use `next/image`, scoped Client Components, and production builds. Keep global layout work minimal.

## Common mistakes

Optimizing without a baseline, using raw image tags for application assets, or clientifying pages for convenience.

## Example

```tsx
import Image from "next/image";
```

## Related files

`src/app/page.tsx`, `checks/performance.md`, `harnesses/performance-audit.md`
