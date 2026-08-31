# Operations

## Configuration and secrets

Copy `.env.example` to `.env`. Keep `.env` untracked. Required values are:

- `DATABASE_URL`
- `NEXUS_ACCESS_PASSWORD_HASH`: Argon2id hash, never the plaintext password
- `NEXUS_SESSION_SECRET`: at least 32 random characters
- `NEXUS_ATTRIBUTE_HASH_KEY`: at least 32 random characters

`GEMINI_API_KEY` is optional. Without it, narratives use the deterministic fallback and detection remains fully operational.

Generate a password hash locally without writing the password to source control:

```sh
bun --cwd apps/web -e "import argon2 from 'argon2'; console.log(await argon2.hash(process.argv[1]))" "YOUR_LOCAL_PASSWORD"
```

When placing an Argon2 hash in the Compose `.env`, escape every `$` as `$$` so Compose passes the literal hash. Use long, independently generated values for both HMAC secrets.

## Local development

Start a PostgreSQL 18 instance reachable through `DATABASE_URL`, then install the locked dependencies, migrate, seed, and analyze:

```sh
bun install --frozen-lockfile
bun run db:migrate
bun run data:seed
bun run pipeline:run
bun run dev
```

In a second terminal, start durable job processing:

```sh
bun run dev:worker
```

The web application is at `http://localhost:3000`. Dataset generation remains CLI-only.

## Portable deployment

`docker compose up --build` creates PostgreSQL 18.6 plus non-root Node.js 24 web and worker containers. The migration image must finish successfully before either service starts. The database volume is named `nexus-postgres` and survives container replacement.

Run the CLI-only generation and evaluation commands against the Compose database through the worker image:

```sh
docker compose run --rm worker node dist/cli/seed.js
docker compose run --rm worker node dist/cli/pipeline.js
```

The deployment platform should use distinct web, worker, and migration database roles where supported. Terminate TLS at the platform boundary and export telemetry by setting `OTEL_EXPORTER_OTLP_ENDPOINT`.

## Health and diagnostics

- `/api/health/live`: process liveness.
- `/api/health/ready`: web/database readiness.
- worker health command: validates worker heartbeat freshness.

Logs are structured JSON and correlate request, job, run, and dataset identifiers while excluding passwords and normalized attribute material. OpenTelemetry covers database work, queue latency, graph construction, clustering, scoring, evaluation, and Gemini requests.

Failed jobs retain a sanitized failure summary and follow the queue policy in `config/nexus.policy.json`. Before retrying, confirm database readiness, matching web/worker code versions, and valid configuration. Re-running the pipeline is idempotent for the configured immutable inputs.

## Release procedure

Run the same sequence enforced by CI:

```sh
bun install --frozen-lockfile
bun run format:check
bun run lint
bun run typecheck
bun run test
bun run build
bun run db:migrate
bun run db:generate
bun run pipeline:run
bun run test:e2e
bun audit
```

Also build the `web`, `worker`, and `migration` Docker targets and smoke-test `/api/health/ready`. Compare persisted checksums and held-out results with [release-report.md](release-report.md) only when using the same policy and code version.
