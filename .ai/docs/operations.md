# Operations, Environment, and Deployment

## Commands

```bash
npm run dev
npm run lint
npm run format:check
npm run spec:validate
npm test
npm run test:coverage
npm run build
npm start
```

The scripts are in `package.json`. A pnpm installation can run the same scripts, but use only the repository’s selected lockfile in version control.

## Environment variables and external services

`NODIKA_CORE_URL` is a required server-only base URL for the snapshot upload proxy. It must point to an available Nordika Core instance, such as `http://localhost:3001` in local development when the frontend uses port 3000. Never prefix it with `NEXT_PUBLIC_`, commit its value, or expose it to the browser.

The snapshot upload route forwards an uploader-supplied Core JWT only for the duration of the request. Core requires a JWT containing the `source_writer` role for `POST /sources`. The frontend does not store, log, or issue these tokens. There are no other frontend environment variables, external APIs, databases, Stripe integration, Docker configuration, CI workflow, or deployment manifest.

## Deployment

The README links to Vercel because it is inherited from create-next-app; this is not a configured deployment target. Any host must support the Next.js 16 build output. Release validation is `npm run spec:validate && npm run lint && npm run format:check && npm test && npm run build`.

## Testing strategy

Vitest runs deterministic Node tests by default and jsdom tests for interactive components under `src/**/*.test.ts(x)` and `src/**/*.spec.ts(x)`. `npm run test:coverage` enforces at least 80% global line, function, branch, and statement coverage. The versioned `.githooks/pre-commit` runs this gate when a clone opts in using the setup documented in `.githooks/README.md`.
