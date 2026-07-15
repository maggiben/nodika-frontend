# Security Constraints

## Secrets and sensitive data

- Never commit secrets or `.env` files. Never expose secrets to Client Components, source control, logs, or `NEXT_PUBLIC_*` variables.
- Never log JWTs, passwords, session tokens, authorization headers, credentials, or secret-bearing request payloads.
- Never expose stack traces or internal error details to users; log only redacted, actionable server-side diagnostics.

## Trust boundaries

- Never trust client input. Always validate user-controlled data on the server at every API, Server Action, upload, or persistence boundary. React Hook Form validation is UX, not trust validation.
- Always sanitize untrusted HTML before rendering it. Prefer rendering text; do not introduce `dangerouslySetInnerHTML` unless sanitization and the threat model are reviewed.
- Always validate uploaded file size, type, content signature, ownership, storage destination, and authorization server-side before processing.
- Do not add external API calls without timeouts, failure handling, and an approved environment-variable contract.

## Authentication and authorization

- When authentication is introduced, always check authorization after authentication for every protected resource and action.
- Always hash passwords using a modern password-hashing algorithm; never encrypt or store plaintext passwords.
- Use constant-time comparison for secrets, credentials, password-reset tokens, and authentication tokens—not ordinary display strings.
- Never bypass approved authentication or authorization middleware. The current repository has no middleware; document and test its behavior before adding it.

## Transport, persistence, and abuse prevention

- Always use HTTPS in deployed environments and do not introduce insecure HTTP endpoints or callbacks except for explicitly local development.
- When SQL persistence is introduced, always use parameterized queries or a reviewed ORM/query builder. Never construct SQL strings by interpolation or concatenation.
- Do not disable rate limiting on exposed endpoints. No rate-limiting implementation exists yet; define limits, keys, responses, and monitoring before exposing endpoints.
- Do not disable CSP once one is configured. The current project has no CSP policy; define and test it before adding third-party scripts or untrusted content.

## Existing safeguards

- Preserve `rel="noopener noreferrer"` on external `target="_blank"` links, as demonstrated in `src/app/page.tsx`.
- Do not run forceful dependency upgrades or `npm audit fix --force` without reviewing breaking changes.
