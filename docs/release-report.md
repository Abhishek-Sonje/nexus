# Reproducible release report

Reference synthetic held-out evaluation for the frozen v5 detector.

## Lineage

| Artifact         | Reference                                                          |
| ---------------- | ------------------------------------------------------------------ |
| Dataset          | `nexus-heldout-hard-v5-2026-09-02`                                 |
| Run ID           | `01a05f24-b234-7f08-9c58-908834446d51`                             |
| Detector profile | `2026-08-31.1`                                                     |
| Detector seed    | `nexus-louvain-2026-08-31`                                         |
| Threshold        | `45`                                                               |
| Ring count       | `35`                                                               |
| Input checksum   | `ec5a67acc6b109805715ae4eb51e8b56376fa73f04e0c32f34ff9e38b336d4ac` |
| Profile checksum | `ecfc8bd9d5994f2bdb068a098641a9ba8caa235aef8d8d312e4fe29ae582e88e` |
| Output checksum  | `990ff069515ebc06dd2890a41a0cdfd82f55e1d8508ac097eae629a24f2d2cd7` |

The checksums above were read from the persisted reference dataset, locked detector profile, and completed analysis run on 2026-09-04.

## Synthetic held-out evaluation

| Metric                            |           Result |
| --------------------------------- | ---------------: |
| Ring recall                       |   100.0% (35/35) |
| Entity recall                     | 100.0% (344/344) |
| Community precision               |            87.5% |
| Genuine synthetic false positives |                5 |
| Flagged communities               |               40 |
| Matched fraud communities         |               35 |
| Missed synthetic exposure         |               ₹0 |
| Modeled review cost               |           ₹1,250 |
| Total modeled cost                |           ₹1,250 |

These measurements apply only to reproducible synthetic held-out patterns and do not establish real-world fraud performance.

## Verification record

Submission-safety cleanup was performed from Git commit `ceb4406745ad40052381e563c3553cc6c321e338`. On 2026-09-04, the existing reference flow was attempted with `bun run pipeline:run`. It did not complete because the configured database already contained the unique held-out dataset seed, so this cleanup does not claim a fresh database-backed reproduction. The attempted insert reported checksum `4fc81ff5c9730ffd3cb70c8eed954ed19aad77ddb1f85a3543aa484dfb2f54f9`, which differs from the stored reference input checksum; the published metrics above remain the persisted reference results and were not changed.

The cleanup verification ran `bun run format:check`, `bun run lint`, `bun run typecheck`, `bun run test`, and `bun run build`. Database-backed pipeline and end-to-end verification are not included in that claim.
