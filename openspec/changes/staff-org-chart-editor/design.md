## Context

The Staff page (`/[locale]/staff`) already lists Core WhatsApp contacts tagged `staff` in a Data Grid with Test / Remind / Remove actions. Core’s `WhatsAppContact` model only stores `phone`, `label`, `language`, `active`, and `tags` — there is no reportee or org-chart field. Operators still need to track operarios and jornaleros under each jefe de obra so they can ask about individual performance.

## Goals / Non-Goals

**Goals:**

- Org-chart editor per staff lead, opened from a roster **Edit** action.
- One manager (the roster contact) plus a flat list of reports with name + role.
- Persist charts locally per Core contact id for the current browser.
- Surface subordinate counts on the roster and in the editor.
- Draft a performance Q&A message listing each report; copy and optionally test-send to the lead’s phone via existing messaging BFF.

**Non-Goals:**

- Extending Core contact schema or inventing new messaging REST resources.
- Deep trees (grandchildren), drag-and-drop identity merging with other contacts, or HR sync.
- Auto-parsing inbound WhatsApp replies into scored performance.

## Decisions

1. **Local org-chart store (not Core)**  
   Persist a document at `nodika.staffOrgCharts.v1` in `localStorage`, keyed by Core contact `_id`.  
   _Why:_ OpenSpec rules forbid inventing Core contracts; contacts have no metadata bucket for hierarchies.  
   _Alternative considered:_ Encode JSON into `label` — rejected as corruptible and shared-hostile.

2. **Flat reportees under one lead**  
   Model: `{ contactId, contactLabel?, reports: [{ id, name, role }] }` where `role` is `operario` | `jornalero` | `otro` (with optional free-text when `otro`).  
   _Why:_ Matches “jefe → operarios/jornaleros” without overbuilding a full tree UI in v1.

3. **Dedicated localized route**  
   Client page at `/[locale]/staff/[contactId]/org` (auth-gated like Staff).  
   _Why:_ Gives room for the editor + message draft without crowding the roster; deep-linkable from Edit.  
   _Boundary:_ Server Component page checks cookie and loads dictionary; editor is a Client Component.

4. **Roster Edit + team size column**  
   Add Edit (navigates to org route) and a read-only **Team** count derived from the local store (subscribe + cross-tab `storage` events, same pattern as project library).  
   Keep Test / Remind / Remove unchanged.

5. **Performance message draft**  
   Pure function builds a localized body from lead name + each report.  
   UI: preview textarea, Copy, and “Send test” that calls existing test-send with the draft text when Core supports free-text; if test-send is template-only, Copy remains primary and Send is disabled with an explanation. Prefer extending the client to POST whatever the existing test-send already accepts without new Core endpoints — if only template keys work, ship Copy-only in this change and document the limit.

6. **Accessibility**  
   Edit control has an accessible name; org form fields are labeled; role is a select; counts announced in text, not color alone.

## Risks / Trade-offs

- **[Risk] Local-only data is per browser / device** → Mitigation: show a short notice on the editor; document that Core sync is a future change.
- **[Risk] Contact deleted in Core leaves orphan chart keys** → Mitigation: ignore unknown ids on roster; optionally prune on remove contact success.
- **[Risk] Test-send may not accept arbitrary draft bodies** → Mitigation: verify against current BFF; if blocked, ship Copy + catalog path later without inventing APIs.

## Migration Plan

- No server migration. Empty local store means zero counts until users edit.
- Rollback: remove route + Edit column; leftover localStorage keys are harmless.

## Open Questions

- None blocking implementation; test-send free-text capability will be confirmed against the existing BFF during apply.
