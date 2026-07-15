## Context

`sendAssignedCatalogMessages` currently loops every assigned catalog row. Manual `sendCatalogMessage` has no gate either.

## Decisions

1. Per contact, derive the single next catalog message:
   - walk `sortOrder` ascending;
   - if a message was never sent successfully → that is next;
   - if its latest successful send has no `repliedAt` → nothing may be sent (awaiting reply);
   - if all have replies → restart at the lowest `sortOrder` (scheduled cycles).
2. `sendCatalogMessage` rejects with `409 Conflict` when the requested id is not that next message.
3. `advanceCatalogAfterReply` keeps sending the following step after a reply; the gate allows it because the prior thread now has `repliedAt`.
4. Scheduled job groups by contact and sends only that next message (at most one).

## Risks

- Manual “Enviar” on a later card shows an error until earlier steps are answered — intended.
