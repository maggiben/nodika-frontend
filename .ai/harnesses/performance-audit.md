# Performance Audit

## Goal

Improve measurable route performance without changing product behavior.

## Steps

1. Measure the affected route before editing.
2. Inspect `src/app` for unnecessary Client Components, oversized assets, and blocking work.
3. Use Next primitives such as Server Components and `next/image`.
4. Compare the route and production build after the change.

## Expected output

Baseline, change rationale, measurement, and any trade-offs.

## Validation

Run `npm run build`; manually check responsive images and light/dark rendering.

## Rollback strategy

Keep performance work isolated so the measured optimization can be reverted independently.

## Checklist

- [ ] Baseline captured
- [ ] No speculative optimization
- [ ] Image dimensions/alt text retained
- [ ] Client bundle impact considered
