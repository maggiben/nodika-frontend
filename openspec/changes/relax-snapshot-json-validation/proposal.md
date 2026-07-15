## Why

The frontend currently enforces a full `nodika-snapshot-v1` schema before upload, which rejects many otherwise valid JSON documents Core already accepts. Uploaders need JSONLint-style syntax checking so they can submit well-formed JSON without rigid field and date rules.

## What Changes

- Replace semantic snapshot-schema validation with JSON syntax validation (parse + clear syntax errors).
- Keep requiring a top-level JSON object so Core receives an uploadable document.
- Allow submission when syntax is valid and the BFF session is authenticated.
- Stop rejecting unknown fields, date ranges, duplicates, or missing schema_version on the client and upload route.
- Update snapshot-upload unit and UI tests for the looser contract.

## Capabilities

### New Capabilities

### Modified Capabilities

- `snapshot-upload`: Snapshot validation becomes syntax-oriented like JSONLint instead of enforcing schema and task semantics.

## Impact

- `src/lib/nodika-snapshot.ts` and its tests
- Snapshot upload form and route validation gating
- Snapshot upload OpenSpec requirements
