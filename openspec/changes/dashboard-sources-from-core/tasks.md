## 1. BFF

- [x] 1.1 Add `GET /api/snapshots` that proxies Core `GET /sources` with session refresh
- [x] 1.2 Tests for authenticated list / 401 / empty

## 2. Client project store

- [x] 2.1 Replace `snapshot-storage` localStorage library with a fetch-backed in-memory store (projects + selectedId from settings)
- [x] 2.2 Wire load/refresh after mount, upload, and project select
- [x] 2.3 Stop reading/writing `nodika.projectLibrary.v1` and legacy keys

## 3. Consumers

- [x] 3.1 Update `project-selector`, `project-dashboard`, `obra-progress-chip`, `snapshot-upload-form`, `staff-messaging-form`
- [x] 3.2 Update related unit tests

## 4. Validation

- [x] 4.1 `npm test` / lint as needed
- [x] 4.2 `npm run spec:validate`
