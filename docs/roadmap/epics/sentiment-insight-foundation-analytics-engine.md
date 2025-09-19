---
initiatives:
  - docs/initiatives/sentiment-insight-foundation.md
---

# Epic: Sentiment Analytics Engine

## Summary
Transform raw sentiment events into insight-ready aggregates—rolling deltas, variance, anomaly flags—that power dashboards, alerts, and partner APIs.

## Deliverables
- Aggregation jobs that compute time-windowed metrics (1h/24h/7d deltas, participation counts, allocation saturation).
- An analytics TRPC router exposing typed queries for heatmaps, trending axioms, and anomaly feeds.
- Confidence scoring and smoothing rules that mitigate noise in sparse datasets.

## Key Dependencies
- Stable ingest pipeline delivering ordered events with unique identifiers.
- Data modeling support to validate statistical assumptions and thresholds.
- Documentation of metric definitions for product and partner teams.

## Milestones & Exit Criteria
1. **Metric Catalogue** – Stakeholders sign off on the initial metric set, formulas, and data retention policy.
2. **Service Beta** – TRPC endpoints live in staging; internal clients consume metrics without manual joins.
3. **Reliability Gate** – ≥95% of scheduled aggregations complete on time for four consecutive weeks.
