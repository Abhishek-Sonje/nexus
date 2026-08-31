# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated and confirmed: a Node.js 24 LTS production runtime with Bun 1.4 for workspace dependency management and developer scripts; Next.js 16 App Router, React 19, Tailwind CSS 4, PostgreSQL 18, Drizzle ORM, Graphology, Sigma.js, Zod, and optional Gemini enrichment. The application ships as portable containers.

## Users

The primary user is a fraud investigator reviewing suspicious payment-network findings. Nexus is used as a private, read-only analytical workspace rather than a case-management system.

## Product Purpose

Nexus identifies unusual and scam-like payment relationships by scoring the shape and evidence of a network around entities rather than treating each transaction in isolation. Success means a reproducible detector can distinguish injected fraud rings from deliberately dense legitimate relationships and present honest held-out metrics and inspectable evidence.

## Positioning

Nexus combines deterministic community detection, explainable category-aware scoring, legitimate-dense hard negatives, and independently seeded held-out evaluation. An LLM may summarize a finding but never determines risk.

## Operating Context

The first release uses only reproducible synthetic INR data at approximately 2,000 entities. Investigators enter through a private environment-configured access gate, review run-level metrics first, then drill into ranked communities, score components, relationship evidence, and an optional generated narrative.

## Capabilities and Constraints

- Batch analysis now, with immutable jobs and run records that preserve a path to later incremental processing.
- Synthetic tuning, held-out, and demo datasets only; no payment-provider integration.
- Read-only findings; no notes, assignments, dispositions, or case ownership.
- Business policy, costs, thresholds, seeds, and generator parameters are validated, versioned configuration rather than embedded application data.
- INR only, stored in integer paise.
- A false-positive review is illustratively costed at 15 minutes of analyst time at INR 1,000 per hour.
- Known blind spots include small rings, static snapshots, synthetic-ground-truth limits, and no claim of production fraud accuracy.

## Brand Commitments

The product name is Nexus everywhere. The interface is dark-only, metrics-first, professional, defense-oriented, and must avoid theatrical cyber-security styling or unsupported claims.

## Evidence on Hand

`Nexus.md` contains the original detector concept, architecture rationale, proposed signals, held-out evaluation discipline, defense-only framing, and limitations. No real customer, payment, benchmark, or production-validation evidence exists and none may be fabricated.

## Product Principles

- Evidence before narrative.
- Reproducibility before impressive-looking metrics.
- Hard negatives before easy accuracy.
- Explain every score and state every boundary.
- Minimize infrastructure and keep policy outside source logic.

## Accessibility & Inclusion

Meet WCAG 2.2 AA, support full keyboard navigation and reduced motion, never encode risk by color alone, and provide a textual/table alternative for graph relationships. Desktop is primary; mobile preserves metrics and evidence while omitting the dense interactive graph.
