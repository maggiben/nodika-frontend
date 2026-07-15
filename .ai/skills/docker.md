# Containers

## Purpose

Provide a safe adoption gate for containers. No Dockerfile, compose file, or container deployment exists today.

## Responsibilities

When introduced, produce a reproducible production image, least-privilege runtime, explicit build inputs, and documented local workflow.

## Inputs / outputs

Input: a confirmed container-hosting requirement. Output: reviewed Docker configuration, image build test, and environment contract.

## Best practices

Use multi-stage builds, a non-root runtime user, reproducible lockfile installs, and no secrets in image layers.

## Common mistakes

Adding Docker only to mimic another project, copying development node_modules into images, or baking `.env` files into layers.

## Example

```dockerfile
# Introduce only alongside an approved deployment target.
FROM node:22-alpine
```

## Related files

No current container files. Update `docs/operations.md` and release checks when added.
