# Frontend Security

## Purpose

Keep the present Next.js frontend safe as it gains input and service boundaries.

## Responsibilities

Protect secrets, validate input at server boundaries, review external links/assets, and assess dependency changes.

## Inputs / outputs

Input: a change touching user input, external data, configuration, or dependencies. Output: threats, mitigations, and validation evidence.

## Best practices

Keep secrets server-only, retain safe `target="_blank"` rel attributes, use `next/image` source rules, and review audit findings manually.

## Common mistakes

Using `npm audit fix --force`, treating form validation as trust validation, or exposing service credentials with `NEXT_PUBLIC_*`.

## Example

```tsx
<a href={url} target="_blank" rel="noopener noreferrer">
  Open
</a>
```

## Related files

`constraints/security.md`, `checks/security.md`, `src/app/page.tsx`
