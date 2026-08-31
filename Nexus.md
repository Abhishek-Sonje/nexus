# Nexus — Original Build Plan

### Razorpay AI Buildathon · Track 02 — AI Risk Manager

**Claim being made:** most fraud tooling scores one transaction at a time; this scores the _shape of the network_ around a merchant, and specifically targets the hardest sub-case — a merchant account that looks like a legitimate small business on its own but is structurally embedded in a coordinated ring.

---

## 1. Architecture

A synthetic transaction/entity generator seeds Postgres with merchants, payouts, and shared attributes (device fingerprint, payout account, settlement timing). A graph is built in-process from that data. A deterministic clustering pass (Louvain community detection) finds dense sub-communities. A second deterministic scorer ranks each cluster — this produces the risk score, not the LLM. Only flagged clusters get sent to Gemini, whose sole job is turning the cluster's raw signals into a readable investigator brief. A Next.js dashboard shows the graph, the ranked clusters, the narrative, and the honest metrics: precision/recall/false-positive cost against a **held-out** labeled set (why held-out, not just labeled, matters — see §5).

```
[Seed generator] → [Postgres] → [Graph builder (graphology)] → [Louvain clustering]
                                                                        ↓
                                                            [Deterministic risk scorer]
                                                                        ↓
                                                    flagged clusters only → [Gemini 3.7 Flash: narrative]
                                                                        ↓
                                                        [Next.js dashboard + metrics panel]
```

**The central problem this architecture has to solve, stated plainly:** a dense subgraph is not proof of fraud. A franchise chain, a family business running three shops, or a chartered accountant filing for a dozen clients from one office will all produce dense, legitimate clusters. If the detector just flags "dense subgraph," it's not a fraud detector, it's a small-business-relationship detector. Everything in §3 and §4 below exists to handle this — it's not an edge case, it's the actual problem.

---

## 2. Tech stack — decisions, not defaults

| Layer                | Choice                                                             | Why this, not the obvious alternative                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime              | **Bun**                                                            | You know it, fast for a script-heavy pipeline, no reason to switch for a 5-day build.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Language             | **TypeScript** everywhere                                          | One language, faster to debug under time pressure.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Web framework        | **Next.js 15 (App Router)**                                        | Server Components run the clustering query server-side, stream results without a separate API layer.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Database             | **PostgreSQL + Drizzle ORM**                                       | Do not reach for Neo4j. A graph database buys nothing at hackathon scale (low-thousands of nodes) and costs a day of unfamiliar query language. Model the graph as two tables — `entities` and `entity_edges` — and load the whole thing into memory for clustering. Standard pattern below sub-million-node scale.                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Graph algorithms     | **`graphology` + `graphology-communities-louvain`**                | Current, actively maintained standard for in-JS graph analysis. This is the real technical-depth proof point — don't cut it for a hand-rolled heuristic. **Gotcha to know going in:** Louvain has a random component (tie-breaking during community assignment) — running it twice on identical input can give different cluster boundaries. Pin an RNG seed before you start tuning against it, or your precision/recall numbers will shift between runs and undercut the "honest metrics" claim during the demo itself. Also budget time to tune the resolution parameter against your labeled data — the default will either merge unrelated clusters into one blob or fragment real rings; there's no resolution value that's correct out of the box. |
| Cache / coordination | **Redis**                                                          | Cache the last clustering run so the dashboard doesn't recompute on every load; optional backbone for the incremental-recluster stretch goal (§7).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Synthetic data       | **`@faker-js/faker`** + a hand-written ring/hard-negative injector | Faker gives realistic "clean" merchants fast; you write the injection logic yourself because you need to control ground truth precisely — including the legitimate-but-dense cases (§3).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| LLM (narrative only) | **Gemini 3.7 Flash** via `@google/genai`                           | Current GA workhorse model for this class of task, fast and cheap enough to call per-cluster. Don't reach for a Pro-tier reasoning model — narrating a cluster is summarization, not reasoning, and using an expensive model for it reads as not having thought about cost/latency trade-offs.                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| State (dashboard)    | **Zustand**                                                        | Enough for graph-view/cluster-selection state.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Containerization     | **Docker Compose**                                                 | Postgres + Redis + app, one command, works for local dev and a panel demo.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Graph viz            | **`sigma.js`** (reuses the graphology object directly)             | **Don't render the full graph.** At even 1,500 nodes, force-directed layouts get slow and visually unreadable — a wall of lines proves nothing to a judge. Render only flagged clusters plus their immediate neighborhood, on demand, per selected cluster.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |

**Deliberately left out:** ClickHouse. Real experience with it, but it solves a query-latency problem this doesn't have at this scale — including it would be showing off a tool rather than solving the problem, and a judge who knows ClickHouse will clock that immediately.

---

## 3. Data model — and three corrections from the first pass

```ts
entities: {
  id, type: 'merchant' | 'individual', name,
  category,                      // 'retail' | 'food' | 'services' | 'electronics' | ... — see below, needed for baseline
  device_fingerprint,
  payout_account_number,         // corrected signal, see below
  kyc_tier, onboarded_via: 'aggregator' | 'direct',
  created_at
}

entity_edges: {
  source_id, target_id,
  edge_type: 'shared_device' | 'shared_payout_account' | 'fast_settlement_pair',
  weight, observed_at
}

transactions: {
  id, from_entity_id, to_entity_id, amount, settled_at
}

ring_labels: {
  entity_id,
  cluster_type: 'ring' | 'legitimate_dense' | 'isolated',   // corrected, see below
  ring_id
}
```

**Correction 1 — dropped a weak signal, replaced it with a real one.** The first draft used `shared_ifsc` as an edge signal. On reflection this is nearly useless alone: an IFSC identifies a _bank branch_, and thousands of unrelated legitimate customers share one. It would generate noise, not signal. The actual strong version of this idea — and the one real fraud systems use — is a **funnel account**: the same destination `payout_account_number` receiving payouts from multiple _distinct_ merchant entities. That's a real, specific, hard-to-explain-away pattern. Swapped it in.

**Correction 2 — cut a signal instead of shipping it half-defined.** The first draft also had `shared_vpa_pattern` (VPAs that "look similar"). I couldn't define "similar" rigorously without fuzzy string-matching that would itself need its own validation — not a good use of 5 days. Better to ship three well-defined signals than four where one is hand-wavy and falls apart under a judge's first question. Cut it.

**Correction 3 — `fast_settlement_pair` needs an actual number, not a vibe.** Define it concretely: an edge exists if ≥60% of an amount an entity receives is forwarded onward within 6 hours. That's a real layering signature (this is the textbook mule behavior — pass-through, not pooling) and it should be weighted _higher_ than either static shared-attribute signal in the scorer, because rapid pass-through is much harder for a legitimate business to produce by accident than a shared bank branch is. Treat the 60%/6h numbers as tunable hyperparameters you validate against the tuning set (§5), not as fixed truth.

**Correction 4 — the labels need a third category, or the eval is fake.** The first draft's `ring_labels` only had `is_ring_member: true/false`. That's not enough: if every non-ring entity is just scattered random noise, distinguishing "ring" from "not ring" is trivial — of course a dense connected cluster looks different from unconnected points. That would produce great-looking precision/recall numbers that prove nothing. You have to inject **hard negatives**: deliberately construct dense, legitimate-looking clusters (a 4-shop franchise sharing a device at head office, an accountant's laptop filing for 10 real clients, a family running three stalls off one payout account) and label them `legitimate_dense`. The detector has to be tested on whether it can tell those apart from `ring`, not just whether it can tell a cluster from empty space. This is the single most important correction in this document — skip it and the whole "honest metrics" pitch is hollow.

Suggested scale for the demo: ~1,000–2,000 entities, 15–25 injected rings varying in difficulty (some with strong overlap on all three signals, some deliberately partial/subtle), and a meaningful number of `legitimate_dense` hard negatives — not a token one or two.

---

## 4. Pipeline logic

1. **Build graph** — load all `entity_edges` into a `graphology.Graph`.
2. **Cluster** — run seeded Louvain. Log the seed used, so a rerun during the demo reproduces the same numbers.
3. **Score each cluster**, as a weighted sum, not equal weighting:
   - `fast_settlement_pair` density — weighted highest; layering is the hardest signal to produce by accident.
   - `shared_payout_account` count — weighted second; a real funnel pattern, but can occasionally be a legitimate shared business account, so not disqualifying alone.
   - `shared_device` density — weighted lowest of the three; genuinely common in legitimate franchise/family/shared-office setups, which is exactly why the hard negatives in §3 exist — this signal alone should never cross the flag threshold.
   - **Category-baseline deviation** (the actual differentiator): for `aggregator`-onboarded members, compute upfront — from the tuning set only — the mean/stddev of ticket size, transaction frequency, and time-of-day pattern for clean entities _within the same `category`_. Comparing a chai stall against an electronics store baseline is meaningless, which is why `category` is in the schema now. A member's deviation from its own category's baseline is what separates "flag the whole dense cluster" from "flag the specific member that's dressed up as a normal small business" — that's the part of the pitch that isn't one of Razorpay's own example bullets.
4. **Threshold** — don't pick one number and call it done. Plot the full precision-recall curve against the tuning set, then choose an operating point and _justify it in cost terms_: estimate a rupee cost per false positive (manual review time) versus estimated loss per missed ring, and pick the threshold that makes sense for that trade-off. This directly answers the track's explicit "honest metrics including false-positive cost" bar — a single accuracy number does not.
5. **Narrate** — flagged clusters only, one Gemini call, structured signals only (entity IDs and attribute types, never raw PII-shaped fields). **Wrap it in a fallback**: if the call errors or times out, fall back to a deterministic template ("Cluster of {n} entities: {signal summary}, risk score {x}"). A live API hiccup during the panel demo should degrade gracefully, not visibly break the dashboard — this is a concrete, plannable "Failure Recovery" story rather than one you're hoping doesn't happen.
6. **Evaluate** — precision, recall, and false-positive cost against the **held-out** set only (§5) — never the set you tuned weights and threshold against.

---

## 5. Train/tuning vs. held-out split — the part most hackathon entries skip

You are both the generator of ground truth and the tuner of the detector. If you tune scorer weights and the flag threshold against the same synthetic batch you then report precision/recall on, the numbers are close to circular — you're measuring how well you fit your own generator, not how well the approach generalizes. A judge with any ML background will ask this directly.

Fix: generate **two independent synthetic batches with different random seeds** — a tuning batch (weights, threshold, category baselines all get fit here) and a held-out eval batch (touched only at the very end, to produce the numbers you actually report). This is a basic train/test discipline, costs almost nothing extra to implement since the generator is already parameterized, and it's the difference between a defensible metrics panel and a decorative one.

---

## 6. Known limitations — state these up front in the pitch, don't wait to be asked

- **Blind spot on small rings.** Louvain-style community detection needs enough internal density to register as a community. A 2–3 node ring that transacts once and goes dormant may not surface as a cluster at all, or may get diluted into a larger neighboring community. This system is scoped to rings of roughly 5+ members; smaller cliques are a different problem it doesn't claim to solve. Say this explicitly rather than have a judge discover it live.
- **Static snapshot, not streaming.** The core build treats the graph as a batch snapshot. Real rings evolve — members added, dropped, ring reforms after detection. The incremental-recluster stretch goal (§7) is the honest answer to "what about over time," not a claim the base build already handles it.
- **Synthetic ground truth has a ceiling.** Even with hard negatives (§3) and a held-out split (§5), the eval only proves the detector works against the specific patterns your generator can enumerate in 5 days. Real legitimate business structures are more varied than that. Report the numbers as "against the tested hard-negative patterns," not as a universal false-positive guarantee — overselling this is a worse look than stating the boundary.

---

## 7. Framing note — this is a disqualification risk if handled carelessly

Track 02's own rules: _"Strictly defense-only: anything offense-capable is disqualified."_ A synthetic ring-injection generator, described carelessly, can read as "here's how to construct a mule ring that evades detection." Make sure both the code comments and the pitch frame it correctly and consistently: this is a **labeled test harness for evaluating a detector**, not a how-to. Don't demo the generator's internals as a standalone feature — demo the detector catching what it produces.

---

## 8. Stretch goal — only if days 1–5 land early

Incremental reclustering: when a new transaction arrives, re-run Louvain only on the affected subgraph (entities within 2 hops) instead of the whole graph. Cache the last full clustering in Redis, invalidate just the touched region. This is "verification capacity, not generation speed" made concrete. Don't attempt before the core pipeline, hard negatives, and held-out eval are solid — this is decoration on top of a working detector, not a substitute for one.

---

## 9. Five-day build order

| Day | Goal                                                                                                                                                           | Cut-if-behind                                                                                                                                         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Schema (incl. `category`) + Drizzle migrations + generator producing a clean population                                                                        | —                                                                                                                                                     |
| 2   | Ring injector **and** hard-negative (`legitimate_dense`) injector, two seeded batches (tuning + held-out) + graph builder + seeded Louvain running end-to-end  | Reduce ring/hard-negative variety, but keep both categories present — cutting hard negatives entirely is the one cut that invalidates the whole pitch |
| 3   | Weighted scorer (fast-settlement weighted highest) + category-baseline deviation + threshold chosen via precision-recall curve, tuned only on the tuning batch | Skip category-baseline deviation, keep the three edge-based signals                                                                                   |
| 4   | Next.js dashboard: cluster list, metrics panel reporting held-out numbers + FP-cost estimate, sigma.js view of selected clusters only                          | Ship the metrics panel and cluster table before touching graph viz — the numbers matter more than the picture                                         |
| 5   | Gemini narrative + fallback template, Docker Compose packaging, record pitch, write "what broke" section from real numbers                                     | Narrative is the first thing to cut; a strong metrics panel without it still clears the bar, the reverse does not                                     |

**Priority if time runs out:** working detector + hard negatives + held-out metrics > graph visualization > LLM narrative.

## 10. "Failure Recovery" section — write this from what actually happens

Don't invent a story. The realistic one: your first threshold either over-flags (legitimate dense clusters and rings look similar before you tune category-baseline deviation) or under-flags (subtle rings with partial signal overlap slip through). Report the actual precision/recall at your first threshold, what you changed — which signal you reweighted, what the hard negatives revealed — and the numbers after. Evidence of measuring and correcting beats a smooth narrative.
