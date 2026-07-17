## Why

After employees answer WhatsApp progress questions, the AI-updated avances live only in Core progress overlays — there is no way to download a full snapshot JSON with those updates baked in. Operators need a one-click “Bajar patch” export from the avatar menu for the selected project.

## What Changes

- Add a “Bajar patch” / “Download patch” action to the authenticated avatar menu.
- Build a client-side patched snapshot JSON: selected project snapshot with per-task `avance_base` updated from live obra progress reports (AI-parsed employee avances).
- Trigger a browser download of that JSON file when the action is chosen.
- Add ES/EN copy for the new menu label and empty/error states.

## Capabilities

### New Capabilities

- `progress-patch-download`: Build and download a full snapshot JSON patched with live AI-derived progress for the selected project.

### Modified Capabilities

- `application-shell`: Authenticated avatar menu includes a Download patch action.

## Impact

- Frontend: `app-navbar`, new patch-builder helper (snapshot JSON + `fetchObraProgress`), i18n dictionaries, Vitest coverage.
- Reuses existing BFF `/api/messaging/progress` and in-memory project library; no new Core endpoints.
- Non-goals: uploading the patch back to Core, editing the stored snapshot in place, server-side file generation.
