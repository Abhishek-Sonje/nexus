# Methodology

## Evaluation boundary

Nexus generates tuning and held-out datasets from different configured seeds and persists each dataset as an immutable record with its generator snapshot and checksum. Policy selection uses tuning truth only. Once the detector profile is locked, the held-out pipeline applies it without further adjustment.

All displayed performance values are labelled **synthetic held-out evaluation**. They measure recovery of known injected patterns in this generator; they do not estimate performance on real payments.

Planted rings are deliberately constructed to remain observable through the selected evidence vocabulary. This includes payout witnesses, transaction backbones, and timing structure that preserves rapid-flow evidence. The held-out benchmark therefore tests recovery and ranking of generator-aligned synthetic patterns rather than broad real-world fraud detection. Held-out truth is used only for evaluation; it does not enter scoring, community detection, ranking, or threshold selection.

## Evidence construction

The detector receives entities, transactions, and normalized attribute links, but no interface capable of loading truth labels. It derives three evidence families:

- shared device and payout relationships, normalized to limit high-degree pair explosion;
- directional rapid pass-through evidence using timestamp-ordered FIFO allocation, so forwarded funds are not counted repeatedly;
- transaction-network structure retained as raw values and normalized contributions.

Directional records remain available for explanation. Louvain receives a weighted, undirected Graphology projection because the clustering implementation does not accept the mixed evidence graph directly.

## Deterministic clustering and scoring

Louvain uses the detector profile's resolution and injected seeded random-number generator. A repeat is identified by dataset checksum, detector profile, clustering seed, and code version. Community membership and the complete output receive deterministic checksums.

Each community receives bounded features for fast-flow density, funnel or payout concentration, device-sharing density, graph density, and category-baseline anomaly. Category baselines are fitted from clean tuning members with robust median/MAD and time-of-day distributions. Raw measurements remain attached to the run for explanation.

The score is a versioned weighted sum. A shared-device signal by itself cannot satisfy the flag rule. Gemini text is available on demand only for flagged findings after deterministic scoring and cannot alter a score, band, rank, threshold, or metric. A request is processed through the durable PostgreSQL worker queue, and successful output is cached by finding, prompt version, and model.

## Tuning and economics

The tuning search evaluates the configured Louvain resolutions, weight candidates, and score thresholds. Its illustrative objective is:

`total cost = false-positive communities × ₹250 + missed synthetic ring exposure`

The ₹250 review cost represents 15 minutes at ₹1,000 per hour. It is a demonstration assumption, not an observed operational cost.

## Held-out matching and metrics

Detected communities are matched one-to-one with truth groups by maximum member overlap, subject to the profile's Jaccard requirement. The evaluation stores the precision-recall/economic curve and reports entity precision and recall, community precision, ring-detection recall, legitimate-dense false positives, missed exposure, review cost, and total cost.

See [limitations](limitations.md) before interpreting any result.
