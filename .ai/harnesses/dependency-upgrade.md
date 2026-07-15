# Dependency Upgrade

## Goal

Upgrade a dependency with compatible Next.js 16/React 19 behavior and an isolated rollback path.

## Steps

1. Identify the current version, target version, changelog, peer dependencies, and why the upgrade is needed.
2. Update one lockfile through the selected package manager.
3. Review configuration/API changes and update affected source/tests.
4. Record security-audit findings separately from upgrade success.

## Expected output

Version change, lockfile update, compatibility notes, and validation evidence.

## Validation

Run `npm run lint`, `npm test`, and `npm run build`; manually test relevant routes.

## Rollback strategy

Restore the previous package and its matching lockfile; do not use forceful audit fixes as rollback.

## Checklist

- [ ] Justification and changelog reviewed
- [ ] No competing lockfile
- [ ] Peer compatibility checked
- [ ] Build passes
