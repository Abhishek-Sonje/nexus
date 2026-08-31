# Nexus implementation handoff

## Current state

The repository is initialized on `main` and clean. Five atomic commits are present:

1. `53df8f9 chore(repo): initialize nexus workspace and quality gates`
2. `e746ad1 docs(product): record nexus architecture and design decisions`
3. `ca27cd7 feat(config): validate runtime and policy configuration`
4. `c9c84f8 feat(db): add core nexus schema and migrations`
5. `4acbd47 feat(synthetic): generate reproducible labeled datasets`

Completed work:

- Bun workspace structure for web, worker, core, database, detector, and generator packages.
- Latest stable dependencies resolved in `bun.lock`.
- Strict TypeScript, ESLint, Prettier, Vitest, and Playwright foundations.
- Confirmed product record in `PRODUCT.md` and original plan renamed to Nexus in `Nexus.md`.
- Code-first **Signal Observatory** UI direction recorded in `docs/ui-direction.md`.
- Versioned generator/detector/economic policy in `config/nexus.policy.json`.
- Shared Zod contracts, INR money helpers, API envelopes, and environment validation in `packages/core`.
- Normalized PostgreSQL schema and initial Drizzle migration in `packages/db`.
- Deterministic synthetic generator with independently seeded splits, injected rings, legitimate-dense hard negatives, shared attributes, rapid ring flows, stable UUIDs, and dataset checksums in `packages/synthetic`.
- Generator unit tests cover reproducibility, split isolation, class presence, and target transaction count.

Not yet implemented:

- Persistence service that writes generated datasets to PostgreSQL.
- Graph evidence derivation, FIFO pass-through attribution, seeded Louvain, scoring, tuning, and evaluation.
- Worker orchestration and pg-boss jobs.
- Optional Gemini structured narratives and deterministic fallback.
- Private access gate, Next.js routes, APIs, and dashboard.
- Docker Compose, production containers, observability, CI, E2E tests, visual QA, and final design documentation.

## Locked decisions

- Product name: **Nexus** only.
- Production-minded MVP using synthetic data only; no Razorpay or live payment integration.
- Primary user: fraud investigator.
- Read-only analysis: no case notes, assignments, or dispositions.
- Batch processing with interfaces suitable for later incremental processing.
- Approximately 2,000 entities and 50,000 transactions per configured dataset.
- Node.js 24 LTS in production containers; Bun 1.4 target for workspace tooling.
- PostgreSQL 18 plus Drizzle; pg-boss instead of Redis.
- INR only, stored as integer paise.
- No embedded records or source-coded business policy. Tunables are validated versioned configuration.
- False-positive review economics: 15 minutes at INR 1,000/hour, or INR 250 per false-positive community.
- Gemini 3.7 Flash is optional narrative enrichment and cannot influence scores.
- UI: dark-only, metrics-first, desktop-primary, code-first Signal Observatory.

## Environment notes

- Development host currently has Node `22.14.0` and Bun `1.3.5`; both are sufficient for current local checks.
- `package.json` intentionally targets Bun `1.4.0`, and production containers must use Node 24 LTS.
- Docker CLI is installed, but Docker Compose and PostgreSQL have not been started or tested yet.
- No `.env` exists. Copy `.env.example` and provide secure values before running migrations or services.
- Drizzle migration generation is configured through `packages/db/node_modules/drizzle-kit/bin.cjs` because Bun 1.3 workspace scripts do not expose workspace `.bin` commands reliably.
- Vitest passes but prints a future Vite native-config warning because the root package is CommonJS. Resolve by renaming `vitest.config.ts` to `vitest.config.mts` or adding a scoped ESM configuration before the final quality pass.
- Writes to `.git` require elevated tool permission in this environment. Continue committing after every verified boundary.

## Verification already completed

```text
bun run --filter @nexus/core typecheck       PASS
bun run --filter @nexus/db typecheck         PASS
bun run --filter @nexus/synthetic typecheck  PASS
bun run test -- packages/core                PASS (2 tests)
bun run test -- packages/synthetic           PASS (3 tests)
bun run lint                                 PASS
```

The generated migration contains 17 application tables and their enums, indexes, constraints, and foreign keys. No database integration test has run yet.

## Exact next implementation slice

Implement `packages/detection` as pure, database-independent logic before adding the worker:

1. Define detector input types that contain entities, attribute links, and transactions but cannot contain or import ground-truth labels.
2. Derive shared-device and shared-payout evidence with degree-cap normalization from the versioned detector profile.
3. Implement timestamp-ordered FIFO inbound-lot allocation for fast-flow evidence; prevent the same inbound funds from being attributed twice.
4. Project directional evidence into a weighted undirected Graphology `MultiGraph`.
5. Run `graphology-communities-louvain` with `seedrandom(profile.randomSeed)` and persist detailed modularity output in a pure result type.
6. Add focused tests for attribute sharing, degree caps, flow-window boundaries, partial forwarding, double-count prevention, and deterministic partitions.
7. Run typecheck, targeted tests, and lint, then commit:

```text
feat(detection): derive normalized graph evidence
feat(detection): add seeded community detection
```

After that, add feature extraction/scoring, tuning/evaluation, persistence repositories, and worker composition in that order. Keep ground-truth access in the evaluation module only; the detection package must never receive labels.

## Remaining commit sequence

Use these as boundaries, splitting further when a change cannot be reviewed atomically:

```text
feat(detection): derive normalized graph evidence
feat(detection): add seeded community detection
feat(scoring): add explainable category-aware risk features
feat(tuning): select and persist economic operating points
feat(evaluation): report held-out detection metrics
feat(worker): orchestrate durable analysis jobs
feat(ai): add optional structured narratives and fallback
feat(auth): protect the private nexus workspace
feat(web): build the metrics-first investigation dashboard
feat(graph): add bounded accessible relationship exploration
feat(observability): instrument web worker and pipeline stages
test(e2e): cover the complete investigator workflow
chore(container): add portable production containers
ci: enforce nexus release quality gates
docs: publish methodology operations and limitations
```

Before each commit: inspect `git diff`, run the narrow relevant typecheck/tests plus `bun run lint`, stage only that concern, and use a Conventional Commit message.

## UI implementation and finish obligations

The Signal Observatory direction contract must be the first emitted child of the root `<body>` and survive the production build. Use seed key `171a808a`.

The first viewport must show the held-out evaluation verdict, economic cost curve, immutable run provenance, and the beginning of ranked findings. Avoid neon, glow, glass decoration, generic equal-sized metric cards, fake terminal styling, and graph-first composition.

When UI work begins, re-read the Impeccable skill and its craft floor. At finish:

1. Capture valid desktop and mobile screenshots into `.impeccable/review/`.
2. Run the Impeccable detector once over changed UI targets.
3. Spawn the required fresh `impeccable-finish-reviewer` with screenshots, contract, findings, and craft-floor path.
4. Apply the reviewer disposition exactly.
5. Spawn the required documenter to generate `DESIGN.md` from the shipped interface.

The chosen workflow is code-first; no image comp is owed.

## Useful commands

```powershell
bun install --frozen-lockfile
bun run lint
bun run test
bun run typecheck
bun run db:generate
$env:DATABASE_URL='postgresql://nexus:nexus@localhost:5432/nexus'; bun run db:migrate
git status --short --branch
git log --oneline --decorate -10
```

Do not run formatting over unrelated user changes, do not commit `.env`, and do not replace the generated Drizzle migration without reviewing the SQL diff.
