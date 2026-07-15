# Database and Persistence

## Purpose

Prevent speculative persistence design. This repository has no schema, ORM, migrations, or database connection.

## Responsibilities

Before adding persistence, establish data ownership, retention, privacy, migrations, transaction rules, and a server-only access layer.

## Inputs / outputs

Input: approved data model and provider. Output: versioned schema/migration, typed repository boundary, rollback plan, and tests.

## Best practices

Keep access server-only; validate data before persistence; make migrations forward-compatible and reversible when possible.

## Common mistakes

Embedding queries in Client Components, generating a schema without product requirements, or changing stored data without a migration/rollback.

## Example

```ts
// Future database access belongs in a server-only module, never a client component.
export async function getRecord(id: string) {}
```

## Related files

No current database files. Add the provider contract to `.ai/docs/operations.md` first.
