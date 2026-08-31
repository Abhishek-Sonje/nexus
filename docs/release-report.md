# Reproducible release report

Reference captured on 2026-09-01 from the locked repository configuration and local PostgreSQL evaluation state.

## Lineage

| Artifact                  | Reference value                                                    |
| ------------------------- | ------------------------------------------------------------------ |
| Tuning seed               | `nexus-tuning-2026-08-31`                                          |
| Tuning dataset checksum   | `766edca593244a8f4750b79f00be8ad8d524c5c690fcba7613056a2bf4022233` |
| Held-out seed             | `nexus-heldout-2026-08-31`                                         |
| Held-out dataset checksum | `6e7bca29b25c6996e068aa4c6e13efbb495b947b7d420f7d005e98a46b2bccda` |
| Detector profile          | `2026-08-31.1`                                                     |
| Detector checksum         | `d7bf4a037287d096820917c026ddfa1ad3eb592289e47cea4904a245094cea7a` |
| Louvain seed              | `nexus-louvain-2026-08-31`                                         |
| Selected resolution       | `0.7`                                                              |
| Selected threshold        | `45`                                                               |
| Held-out output checksum  | `ff8ac6013752c1eed6302ad97f38063deec003f79fc38945090f99c2cda18c19` |

## Synthetic held-out evaluation

| Metric                           | Result |
| -------------------------------- | -----: |
| Entity precision                 |   100% |
| Entity recall                    |   100% |
| Community precision              |   100% |
| Ring-detection recall            |   100% |
| Legitimate-dense false positives |      0 |
| Review cost                      |     ₹0 |
| Missed synthetic exposure        |     ₹0 |
| Total illustrative cost          |     ₹0 |

These values measure only reproducible synthetic held-out patterns. They do not establish real-world fraud performance. In particular, the perfect result should motivate harder future generators and external validation rather than a claim of solved fraud detection.

## Verification record

- Formatting, lint, and all workspace typechecks passed.
- Eight Vitest files passed with 21 tests.
- All workspace production builds passed on Node.js 24 tooling.
- Playwright passed the desktop and mobile investigator workflow, mobile graph fallback, and serious/critical Axe checks; the desktop-only duplicate of the mobile assertion is intentionally skipped.
- Web, worker, and migration container targets built successfully; the web container readiness endpoint passed a disposable runtime smoke test.

To compare a clean clone, use the exact lockfile and policy configuration, migrate a clean PostgreSQL database, run `bun run data:seed`, then `bun run pipeline:run`. A different code version, policy snapshot, seed, or dependency lock invalidates checksum comparison.
