## 1. Core catalog link on flow nodes

- [x] 1.1 Add optional `catalogMessageId` to MessageFlowNode schema/DTO/validate; denormalize title/body from catalog on upsert
- [x] 1.2 Resolve catalog copy in `sendFlowNodeMessage`; set StaffMessage.catalogMessageId; fail if inactive/missing
- [x] 1.3 Unit tests: linked send uses catalog; inactive catalog fails; legacy node still works

## 2. Frontend flow editor reuse

- [x] 2.1 Types/parsers: optional `catalogMessageId` on flow nodes
- [x] 2.2 Editor: load catalog, add-from-catalog select, show linked badge; connect via arrows; keep order DnD
- [x] 2.3 Demote blank/preset node add; edit copy points staff to Mensajes for linked nodes
- [x] 2.4 i18n (es/en) + unit tests for parse/validate with catalogMessageId

## 3. Validate

- [x] 3.1 Core targeted tests + frontend tests + openspec validate
