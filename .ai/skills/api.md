# API Boundaries

## Purpose

Guide the first API boundary; no API routes, server actions, or clients exist today.

## Responsibilities

Define a typed request/response contract, validate untrusted input on the server, and return intentional error states.

## Inputs / outputs

Input: approved backend capability. Output: a minimal route handler or server action plus tests and documented environment requirements.

## Best practices

Keep secrets server-only, validate runtime values, version breaking contracts, and let Server Components call server code directly where practical.

## Common mistakes

Treating TypeScript types or React Hook Form rules as server validation; exposing tokens through `NEXT_PUBLIC_*`; creating a client before a contract exists.

## Example

```ts
// Validate request data before passing it to domain logic.
const input: unknown = await request.json();
```

## Related files

No current API files. Future routes belong in `src/app/api/`; update `docs/operations.md`.
