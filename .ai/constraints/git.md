# Git Constraints

- Never force-push to `main` or rewrite published history.
- Never overwrite, reset, or commit unrelated work in the parent repository.
- Never commit `node_modules`, `.next`, coverage, build artifacts, `.env*`, credentials, or secrets.
- Never commit generated files, except the single package-manager lockfile required for reproducible dependency resolution.
- Keep one package-manager lockfile; do not introduce a second lockfile during a dependency change.
- Keep commits focused: separate unrelated refactors, dependency upgrades, and behavior changes when that improves review or rollback.
- Update tests for every behavior change. If no test is feasible in the current Node Vitest setup, document the limitation in the change.
- Update `.ai/docs/` and relevant framework guidance when architecture, tooling, service contracts, or developer workflows change.
- Always run formatters and review `git diff --check` plus the staged diff before committing.
- Always resolve merge conflicts completely and rerun relevant validation before merging.
