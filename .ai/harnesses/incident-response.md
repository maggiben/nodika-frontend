# Incident Response

## Goal

Restore a safe frontend experience when a future production incident occurs.

## Steps

1. Confirm impact, affected route/version, and user-visible symptoms.
2. Stabilize with rollback, feature disablement, or an approved focused fix.
3. Preserve evidence without exposing user data or secrets.
4. Validate recovery and create a follow-up root-cause action.

## Expected output

Timeline, impact, mitigation, validation, owner, and prevention work.

## Validation

Confirm the affected route on the production artifact and rerun the local production build where relevant.

## Rollback strategy

Prefer deploying the last known-good artifact. There is currently no observability or feature-flag system; establish ownership before relying on either.

## Checklist

- [ ] User impact known
- [ ] Secrets redacted
- [ ] Rollback decision recorded
- [ ] Follow-up test/check added
