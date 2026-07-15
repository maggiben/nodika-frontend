# Migration

## Goal

Safely migrate framework, data, API, or infrastructure behavior only after the relevant system exists.

## Steps

1. Define source/target states, owners, compatibility window, and affected clients.
2. Choose an incremental rollout and rollback plan.
3. Add validation, tests, and production monitoring requirements.
4. Execute and verify each stage; remove compatibility code only after the window closes.

## Expected output

Migration design, implementation, validation evidence, and rollback instructions.

## Validation

Run repository checks plus migration-specific verification. Current repository has no data/API migration system.

## Rollback strategy

Keep old reads/writes compatible where feasible; never run irreversible persistence changes without an approved backup/recovery plan.

## Checklist

- [ ] Real system and owner identified
- [ ] Backward compatibility considered
- [ ] Rollout and rollback documented
- [ ] No speculative schema generated
