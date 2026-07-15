# CI/CD

## Purpose

Define the future CI gate without claiming an existing workflow. No CI configuration is present.

## Responsibilities

When CI is introduced, run deterministic install, format check, lint, tests, and production build before release.

## Inputs / outputs

Input: approved CI provider and deployment target. Output: minimal workflow, cache policy, protected secrets, and failure visibility.

## Best practices

Use lockfile-respecting installs, pin action/tool versions, fail on required quality checks, and separate build from deployment credentials.

## Common mistakes

Creating a workflow without a lockfile policy, placing secrets in logs, or auto-deploying unreviewed branches.

## Example

```bash
npm run format:check && npm run lint && npm test && npm run build
```

## Related files

`package.json`, `checks/release.md`, `docs/operations.md`
