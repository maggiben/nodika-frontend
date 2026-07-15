## Context

Core currently exposes only authenticated `POST /sources`: it accepts a multipart JSON file, verifies a bearer JWT with the `source_writer` role, and stores any valid JSON object. It has no CORS configuration and no `nodika-snapshot-v1` schema. The browser therefore cannot safely post directly to Core, and Core cannot reject a semantically broken snapshot.

## Goals / Non-Goals

**Goals:**

- Let an authorized uploader paste and inspect snapshot JSON with syntax highlighting.
- Detect malformed JSON and invalid `nodika-snapshot-v1` structure before network submission.
- Revalidate on the Next.js server and proxy a multipart JSON file to Core without logging or persisting the JWT.
- Display actionable validation and Core response errors without exposing stack traces.

**Non-Goals:**

- Modifying Core, defining a new Core snapshot endpoint, or persisting snapshot data in the frontend.
- Implementing user login, session storage, or token refresh.
- Supporting arbitrary JSON schemas or rich code-editor features beyond JSON editing.

## Decisions

### Client editor and form boundary

The `/` page remains a Server Component and renders a narrow Client Component for the form. React Hook Form manages JSON and password-style JWT inputs. CodeMirror with the JSON language extension provides syntax highlighting. A custom TypeScript validator performs parse and semantic checks continuously without adding a schema dependency.

### Snapshot validation

Validation requires `schema_version: "nodika-snapshot-v1"`, a well-formed metadata object, ISO calendar dates for the cycle and task dates, a non-empty task array, unique non-empty task IDs and labels, finite non-negative numeric duration/progress fields, and start dates no later than end dates. Task dates need not be constrained to the cycle because the supplied example contains tasks before its cycle start.

The route handler repeats this validation because client checks are not trusted. It rejects invalid JSON before any Core request.

### Core forwarding and credential handling

`POST /api/snapshots` accepts JSON plus a bearer token from the same-origin form, constructs a `File` named `nodika-snapshot.json`, and forwards it as `multipart/form-data` field `file` to `${NODIKA_CORE_URL}/sources`. The token is passed only in the upstream Authorization header, never logged, returned, stored, or included in errors.

The browser token is the selected interim authorization method because the frontend has no session/auth system. A server-wide Core token would make a public frontend route act with elevated privileges, so it is explicitly not used.

### Configuration and error behavior

`NODIKA_CORE_URL` is server-only and required by the route handler. Missing configuration returns a generic `503` without a stack trace. Core non-success responses are mapped to safe user-facing status messages; raw upstream bodies and tokens are never exposed.

## Risks / Trade-offs

- [Manual token entry can be inconvenient] → The form uses `type="password"`, no persistence, and a clear requirement for a Core-issued `source_writer` token.
- [Core stores arbitrary JSON] → Both client and server enforce the snapshot schema before forwarding.
- [No Core CORS] → The Next.js same-origin route handler performs the cross-origin call server-side.
- [No token issuer exists in the frontend] → A future auth integration can replace the manual token field without changing Core forwarding semantics.

## Migration Plan

Deploy with `NODIKA_CORE_URL` configured to the reachable Core origin and an existing Core JWT issuer configured with the same `JWT_SECRET`. Roll back by removing the frontend route and form; Core source records already created remain available because no delete API exists.

## Open Questions

- Core does not have a project-specific snapshot retrieval or processing contract; a later Core change may replace generic `/sources` storage.
