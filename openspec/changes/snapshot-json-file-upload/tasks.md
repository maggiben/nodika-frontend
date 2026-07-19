## 1. i18n

- [x] 1.1 Add es/en strings for file picker label, help text, non-JSON rejection, and file-read failure
- [x] 1.2 Update upload editor help copy to mention loading a local `.json` file

## 2. Upload form UI

- [x] 2.1 Add a hidden `input type="file"` (`accept=".json,application/json"`) and a button that opens it on `SnapshotUploadForm`
- [x] 2.2 On file select: reject non-`.json` names with an error and unchanged editor; on success read text, set form/editor value, clear prior result/submission errors
- [x] 2.3 On read failure, show the file-read error and leave editor unchanged

## 3. Tests and validation

- [x] 3.1 Extend `snapshot-upload-form.test.tsx` for valid load, non-JSON rejection, and read failure
- [x] 3.2 Run `npm test` for affected tests, `npm run lint`, `npm run format`, and `npm run spec:validate`
- [x] 3.3 Run `npm run build` to confirm production build succeeds
