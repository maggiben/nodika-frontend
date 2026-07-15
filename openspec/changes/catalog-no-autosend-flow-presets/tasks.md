## 1. Core — no catalog autosend

- [x] 1.1 Remove send from `createCatalogMessage` and `assignCatalogMessage`
- [x] 1.2 Update Core unit tests that expected sendInteractive on create/assign
- [x] 1.3 Deploy Core

## 2. Frontend catalog copy

- [x] 2.1 Stop claiming “enviado” on create/assign success messages
- [x] 2.2 Tests if any assert autosend copy

## 3. Flow editor preset nodes

- [x] 3.1 Add “add node from preset” control using org chart of selected start contact when present
- [x] 3.2 i18n + light test for seed helper if extracted

## 4. Validation

- [x] 4.1 Core test:cov + frontend targeted tests + openspec validate
- [x] 4.2 Commit, push, deploy both
