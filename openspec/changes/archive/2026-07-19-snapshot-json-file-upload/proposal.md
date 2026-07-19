## Why

Uploading a project snapshot today requires pasting large JSON into the CodeMirror editor. That is slow and error-prone for real export files. Users need to pick a `.json` file from their computer so the same validation and BFF upload flow can run without manual copy-paste.

## What Changes

- Add a file picker on `/upload` that accepts JSON snapshot files from the local disk
- Load the chosen file’s text into the existing editor so users can review or tweak before submit
- Keep paste/edit as a supported path; file load does not replace the editor
- Reject non-JSON extensions or unreadable files with a clear client-side error before upload
- Extend i18n strings (es/en) and tests for the file-load path

## Capabilities

### New Capabilities

- (none)

### Modified Capabilities

- `snapshot-upload`: Require a local JSON file picker that fills the snapshot editor; preserve existing syntax validation and authenticated upload behavior

## Impact

- `src/components/snapshot-upload-form.tsx` and its tests
- Upload dictionary keys under `src/i18n/dictionaries/`
- No API, Core, or session contract changes — upload still posts editor JSON to `POST /api/snapshots`
