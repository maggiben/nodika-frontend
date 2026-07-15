# Authentication and Authorization

## Purpose

Set requirements for an auth integration; none exists in the current project.

## Responsibilities

Define identity provider, session lifecycle, authorization policy, protected routes, error behavior, and server-side enforcement.

## Inputs / outputs

Input: approved identity and role requirements. Output: server-enforced session/authorization layer, protected UI behavior, test plan, and environment contract.

## Best practices

Authorize on the server for every protected operation; minimize identity data sent to Client Components; use secure cookie defaults.

## Common mistakes

Using UI visibility as authorization, trusting a client-supplied user ID, or adding provider secrets to public variables.

## Example

```ts
// Future protected server boundary: verify identity before reading protected data.
async function requireUser() {}
```

## Related files

No current auth files or environment variables. Update `constraints/security.md` when introduced.
