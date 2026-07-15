## Why

Project snapshot data is currently exported as JSON but cannot be reviewed, validated, and stored through Nordika Frontend. Uploading malformed snapshots would create unusable source records, while sending the Core credential directly across origins is blocked by the backend’s current CORS configuration.

## What Changes

- Add a client-side snapshot upload form at `/` using React Hook Form and a CodeMirror JSON editor.
- Validate JSON syntax and the `nodika-snapshot-v1` structure before enabling submission, including required metadata, task dates, numeric fields, and date-range consistency.
- Add a same-origin Next.js route handler that repeats snapshot validation and forwards the JSON file to Core’s existing authenticated `POST /sources` endpoint.
- Require an uploader-provided Core JWT with the `source_writer` role; keep it only in browser memory and never log, persist, or return it.
- Add server-only `NODIKA_CORE_URL` configuration documentation.

## Capabilities

### New Capabilities

- `snapshot-upload`: Validated, authenticated forwarding of Nodika snapshot JSON to Core source storage.

### Modified Capabilities

- `home-page`: The public home page will present the snapshot upload workflow instead of the create-next-app starter content.

## Impact

- Affects `src/app/page.tsx` and adds client components, validation utilities, and a Next.js route handler.
- Adds CodeMirror JSON editor dependencies.
- Integrates with Core’s existing `POST /sources` multipart endpoint; it does not modify Core or create a snapshot-specific backend contract.
- Adds the server-only `NODIKA_CORE_URL` environment variable. Uploaders must provide an existing Core JWT that has `source_writer`.
