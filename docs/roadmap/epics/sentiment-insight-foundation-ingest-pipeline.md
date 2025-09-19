---
initiatives:
  - docs/initiatives/sentiment-insight-foundation.md
---

# Epic: Sentiment Ingest Pipeline

## Summary
Capture every `sentiment` mutation from SurrealDB and stream it into a durable analytics store with low latency so downstream services receive trustworthy change events within minutes.

## Deliverables
- Change data capture (CDC) or polling jobs that emit normalized mutation events to a queue with idempotency guarantees.
- Replayable event log persisted in columnar storage (e.g., DuckDB, ClickHouse) with partitioning by time and sentiment type.
- Monitoring dashboards and alerts that track pipeline health, lag, and failure scenarios.

## Key Dependencies
- Access to SurrealDB operational metrics to tune CDC frequency and backpressure.
- Observability stack enhancements for queue depth, throughput, and error visibility.
- DevOps support to provision storage and secure service credentials.

## Milestones & Exit Criteria
1. **Prototype Feed** – Capture ≥60% of writes in a staging environment with manual validation of event fidelity.
2. **Production Pipeline** – Achieve ≤5 minute end-to-end lag with automated retries and dead-letter handling in place.
3. **Operational Readiness** – Run chaos drills and document runbooks; zero high-severity incidents over two consecutive sprints signals completion.
