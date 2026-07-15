# Frontend pre-commit hook

This hook runs `npm run test:coverage` and blocks commits when global coverage falls below 80%.

The Git root is the parent `nodika` repository, so this frontend cannot activate its own shared hook without changing parent-repository Git configuration. To opt in locally, run this from the parent repository root:

```bash
git config core.hooksPath nordika-frontend/.githooks
```

This affects only the local clone. The executable hook stays versioned with the frontend.
