# Git Workflow

## Purpose

Keep changes reviewable in a repository currently rooted above `nodika-frontend`.

## Responsibilities

Inspect the complete diff before commits, stage only relevant files, and preserve unrelated user work.

## Inputs / outputs

Input: completed, validated change. Output: a focused diff and commit-ready file set.

## Best practices

Use small logical commits, include test/build evidence, and document behavior changes in the body when useful.

## Common mistakes

Committing generated `.next/`, dependencies, environment files, competing lockfiles, or unrelated parent-repository changes.

## Example

```bash
git status --short
git diff --check
```

## Related files

`.gitignore`, `constraints/dependencies.md`, `checks/release.md`
