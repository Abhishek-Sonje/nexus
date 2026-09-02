# Reproducible release report

Reference synthetic held-out evaluation for the frozen v5 detector.

## Lineage

| Artifact         | Reference                              |
| ---------------- | -------------------------------------- |
| Dataset          | `nexus-heldout-hard-v5-2026-09-02`     |
| Run ID           | `01a05f24-b234-7f08-9c58-908834446d51` |
| Detector profile | `2026-08-31.1`                         |
| Detector seed    | `nexus-louvain-2026-08-31`             |
| Threshold        | `45`                                   |
| Ring count       | `35`                                   |

Input and output checksums should be recorded from the persisted run when publishing an immutable artifact; none are repeated here without verified source data.

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

Typecheck, focused authentication tests, and lint pass on the submission working tree. The full test suite retains one unrelated synthetic generator failure; see the final handoff for details.
