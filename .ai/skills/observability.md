# Observability

## Purpose

Set an adoption path for production visibility; no logging, metrics, tracing, or error-reporting provider is configured.

## Responsibilities

Define actionable events, request correlation, privacy limits, error ownership, and alert thresholds before selecting tooling.

## Inputs / outputs

Input: approved production support requirement. Output: server/client error strategy, redaction policy, dashboards/alerts, and incident runbook updates.

## Best practices

Log structured events without credentials or personal data; distinguish expected validation errors from service failures.

## Common mistakes

Adding a vendor SDK to every Client Component, logging secrets, or alerting on non-actionable events.

## Example

```ts
// Future logs must use structured, redacted fields.
console.error({ event: "request_failed", requestId });
```

## Related files

No current observability files. Update `harnesses/incident-response.md` when introduced.
