# Release

## Goal

Prepare the current frontend for a host-neutral production release.

## Steps

1. Replace starter metadata/content or explicitly exclude the release from product launch.
2. Confirm configured environment/service contracts; current repository has none.
3. Run release checks and validate the production build.
4. Publish only through an approved host with a documented rollback.

## Expected output

Release notes, validation results, deployment reference, and rollback owner.

## Validation

`npm run format:check`, `npm run lint`, `npm test`, `npm run build`, then host-specific smoke checks.

## Rollback strategy

Redeploy the prior immutable artifact or revert the release commit; never change runtime data without its migration rollback.

## Checklist

- [ ] Placeholder metadata reviewed
- [ ] Release checks passed
- [ ] Environment variables documented
- [ ] Rollback path tested or owned
