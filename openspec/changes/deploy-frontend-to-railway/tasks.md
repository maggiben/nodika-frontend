## 1. Railway frontend configuration

- [x] 1.1 Add a Railway service manifest with production build, start, restart, and root health-check settings.
- [x] 1.2 Create the `nordika-frontend` service in the existing production project and configure its server-only Core URL.

## 2. Production deployment

- [x] 2.1 Deploy the frontend, generate its Railway domain, and verify a successful deployment and root response.
- [x] 2.2 Configure a persistent Core JWT signing secret and redeploy Core from its current source so its `/sources` endpoint is available.
- [x] 2.3 Verify an authorized snapshot upload through the public frontend results in a persisted MongoDB source record.

## 3. Quality and documentation

- [x] 3.1 Run local formatting, linting, tests, OpenSpec validation, and production-build checks.
