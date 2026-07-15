# Create Component

## Goal

Create a reusable, accessible component without prematurely introducing a component-library abstraction.

## Steps

1. Confirm the UI repeats or has a stable boundary; otherwise keep it in its route.
2. Put the component under a feature-local folder or a future shared `src/components` only when reused.
3. Type props precisely and decide whether browser interaction requires `"use client"`.
4. Use Material UI components and the shared `AppTheme`.

## Expected output

A semantic component with named, typed props and documented ownership.

## Validation

Run `npm run lint`, `npm run format:check`, and add a Vitest test when behavior is executable in Node.

## Rollback strategy

Restore the calling route’s local markup and remove the unreferenced component.

## Checklist

- [ ] Server-safe unless interaction requires client code
- [ ] Semantic HTML and focus behavior
- [ ] No duplicate style tokens
- [ ] No generic `Props` with `any`
