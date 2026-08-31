# Nexus

Nexus is a private, containerized investigation workspace for reproducible fraud-network detection on synthetic payment data. It builds deterministic evidence graphs, clusters them with seeded Louvain, scores communities with inspectable features, and reports final metrics only on an independently seeded held-out dataset.

Nexus is a defense-oriented evaluation system. It is not a live payment platform, a case-management product, or evidence of real-world fraud accuracy.

## Quick start

Prerequisites: Node.js 24, Bun 1.4, Docker, and Docker Compose.

1. Copy `.env.example` to `.env` and replace every blank secret.
2. Generate an Argon2id hash for your chosen workspace password as described in [operations](docs/operations.md).
3. Start the portable stack:

   ```sh
   docker compose up --build
   ```

4. Generate the deterministic datasets and run the tuning/held-out pipeline inside the worker image:

   ```sh
   docker compose run --rm worker node dist/cli/seed.js
   docker compose run --rm worker node dist/cli/pipeline.js
   ```

5. Open `http://localhost:3000` and enter the password whose hash you configured.

For local development, migration, health checks, worker operation, telemetry, and recovery guidance, see [docs/operations.md](docs/operations.md).

## Repository map

- `apps/web`: Next.js private gate, API, and investigator dashboard.
- `apps/worker`: durable pg-boss jobs, analysis pipeline, and optional Gemini narratives.
- `packages/core`: shared contracts, configuration, and money utilities.
- `packages/db`: schema, migrations, and repositories.
- `packages/synthetic`: deterministic dataset generation.
- `packages/detection`: evidence, clustering, scoring, tuning, and evaluation.
- `config/nexus.policy.json`: versioned generator, detector, economics, and queue policy.

## Verification

```sh
bun run format:check
bun run lint
bun run typecheck
bun run test
bun run build
bun run test:e2e
```

The complete automated gate is defined in `.github/workflows/ci.yml`. Method definitions and limitations are documented in [methodology](docs/methodology.md) and [limitations](docs/limitations.md). The reproducible reference output is recorded in [the release report](docs/release-report.md).
