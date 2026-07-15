## Why

The project has tests but no enforceable coverage standard, so a commit can introduce untested behavior. An 80% coverage gate will make minimum test quality verifiable before changes enter history.

## What Changes

- Configure Vitest V8 coverage with 80% global line, function, branch, and statement thresholds.
- Add the Git pre-commit hook required to run the coverage suite and block a failing commit.
- Add unit and component tests for current application behavior until the configured threshold passes.

## Capabilities

### New Capabilities

- `test-coverage-gate`: Coverage enforcement and Git pre-commit validation.

### Modified Capabilities

- `frontend-tooling`: The test command set will provide an enforced coverage check.

## Impact

- Adds Vitest coverage, jsdom, and React Testing Library development dependencies plus a versioned Git hook.
- Updates package scripts, Vitest configuration, test setup, and Git hook files.
