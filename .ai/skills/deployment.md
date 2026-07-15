# Deployment

## Purpose

Guide deployment adoption without treating the starter README’s Vercel link as existing infrastructure.

## Responsibilities

Choose a supported host, define environment delivery, verify production builds, and document rollback/health checks.

## Inputs / outputs

Input: approved host and release policy. Output: deployment configuration, environment contract, health verification, and rollback runbook.

## Best practices

Deploy immutable builds, keep runtime secrets outside the repository, and promote only artifacts that passed the release checks.

## Common mistakes

Assuming Vercel is configured, relying on development-only behavior, or deploying without a rollback target.

## Example

```bash
npm run build
npm start
```

## Related files

`README.md`, `docs/operations.md`, `checks/release.md`
