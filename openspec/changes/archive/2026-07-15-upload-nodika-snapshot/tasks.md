## 1. Upload foundations

- [x] 1.1 Add the JSON editor dependencies required by the snapshot editor.
- [x] 1.2 Define shared typed snapshot parsing and semantic validation for `nodika-snapshot-v1`.
- [x] 1.3 Add unit tests for valid snapshots, malformed JSON, duplicate task IDs, invalid dates, and invalid numeric fields.

## 2. Upload interface

- [x] 2.1 Replace the starter home content with an accessible React Hook Form snapshot upload Client Component.
- [x] 2.2 Integrate the JSON syntax-highlighted CodeMirror editor and inline validation summary.
- [x] 2.3 Add an in-memory password-style bearer-token input, submit status, and safe Core error display.

## 3. Server forwarding

- [x] 3.1 Add `POST /api/snapshots` with independent snapshot validation and server-only Core URL configuration.
- [x] 3.2 Forward valid JSON as multipart field `file` to Core `/sources` using the submitted bearer token without logging or persisting it.
- [x] 3.3 Add route tests for invalid data, missing configuration, and upstream error mapping.

## 4. Documentation and verification

- [x] 4.1 Document `NODIKA_CORE_URL`, Core JWT requirements, and manual-token handling in the operations documentation.
- [x] 4.2 Run format, lint, unit tests, OpenSpec validation, and production build.
