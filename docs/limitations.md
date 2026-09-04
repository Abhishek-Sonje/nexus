# Limitations and non-goals

Nexus demonstrates a reproducible evaluation method on synthetic data. It must not be presented as a production fraud guarantee, a compliance certification, or a validated model for real payment traffic.

## Known limitations

- Generator assumptions determine the available behaviors and ground truth. Planted rings are deliberately constructed to remain observable through Nexus's selected evidence vocabulary, including payout witnesses, transaction backbones, and timing that preserves rapid-flow evidence. The held-out benchmark therefore measures recovery and ranking of generator-aligned synthetic patterns, not broad real-world fraud-detection accuracy. Held-out truth does not enter scoring, community detection, ranking, or threshold selection.
- The reference scale is 5,000 entities and 100,000 transactions. Larger-scale latency, memory, and partition quality are unproven.
- Detection is batch-based. It does not provide streaming alerts or transaction authorization.
- Small two- or three-member rings are an explicit blind spot for this release.
- Category baselines and hard negatives are synthetic approximations, not learned merchant behavior.
- Louvain partitions can merge or split plausible groups; one-to-one Jaccard matching necessarily simplifies ambiguous overlap.
- The private password gate is suitable for a controlled demonstration, not enterprise identity, authorization, or tenancy.
- Gemini output may be unavailable, malformed, or incomplete. The deterministic fallback is authoritative; narrative prose is not evidence.
- The browser renders only a selected community and bounded neighborhood. It cannot be used to explore the entire dataset at once.

## Explicit non-goals

- real customer or payment-provider ingestion;
- payment initiation, blocking, or settlement;
- investigator assignments, notes, dispositions, or case management;
- Redis, ClickHouse, Neo4j, or an incremental graph store;
- production fraud-accuracy, legal, regulatory, or compliance claims.

Any use beyond synthetic evaluation requires new data governance, identity and authorization design, calibrated real-world validation, bias and drift review, operational response procedures, and an independently reviewed security model.
