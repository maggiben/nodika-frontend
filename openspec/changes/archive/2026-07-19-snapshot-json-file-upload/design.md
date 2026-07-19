## Context

`/upload` already validates JSON syntax client-side via `parseNodikaSnapshot`, posts the editor body to `POST /api/snapshots`, and activates the project on success. The only input path is typing or pasting into CodeMirror, which is painful for real Nodika export files.

## Goals / Non-Goals

**Goals:**

- Let users choose a local `.json` file and load its contents into the existing editor
- Reuse current syntax validation and authenticated upload unchanged
- Show clear errors for wrong extension, empty selection, or failed file reads
- Cover the flow with Vitest and es/en copy

**Non-Goals:**

- Changing the BFF or Core upload contract (still JSON body → multipart forward)
- Drag-and-drop or multi-file import
- Enforcing snapshot schema beyond existing syntax checks
- Auto-submit on file select without user review

## Decisions

1. **Client-side `FileReader` / `file.text()` into the editor, not multipart to the API**
   - Rationale: Server already accepts a JSON body and converts to multipart for Core. Loading into the editor preserves review/edit and keeps one upload path.
   - Alternative considered: `FormData` file upload to a new multipart API — rejected as unnecessary API surface for the same outcome.

2. **Accept `.json` by extension (and `application/json` when present); still require parseable object before submit**
   - Rationale: Extension filter guides users; existing `parseNodikaSnapshot` remains the gate for submit.
   - Alternative considered: Accept any text file — rejected to avoid accidental binary/non-JSON picks.

3. **MUI Button + hidden `<input type="file">` next to the editor**
   - Rationale: Matches Material UI patterns already used on the form; accessible label via i18n.
   - Alternative considered: Native file input only — weaker visual consistency.

4. **Replace editor content on successful load; clear prior submission/result errors**
   - Rationale: File load is an intentional replace of paste content; stale success/error alerts would confuse.

## Risks / Trade-offs

- [Very large JSON freezes the browser editor] → Mitigation: same as today’s paste path; no new size limit in this change. Document if limits appear later.
- [User expects immediate upload on file pick] → Mitigation: Copy clarifies that the file fills the editor; submit remains explicit.
- [Extension spoofing (`.json` with invalid content)] → Mitigation: Existing syntax validation blocks submit; server re-validates.

## Migration Plan

- Frontend-only UI change; deploy with the usual app release. No data migration. Rollback by reverting the change.

## Open Questions

- None — scope is clear for a single-file load into the existing editor.
