# Frontend pre-commit hook

This hook runs the local quality gate and blocks commits when any step fails:

1. `npm run lint`
2. `npm run test:coverage` (global coverage must stay at or above 80%)

The Git root is the parent `nodika` repository, so this frontend cannot activate its own shared hook without changing parent-repository Git configuration. To opt in locally, run this from the parent repository root:

```bash
git config core.hooksPath nodika-frontend/.githooks
```

When this repository is cloned on its own, use:

```bash
git config core.hooksPath .githooks
```

This affects only the local clone. The executable hook stays versioned with the frontend.
