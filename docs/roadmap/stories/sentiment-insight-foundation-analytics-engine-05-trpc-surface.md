---
epic: docs/roadmap/epics/sentiment-insight-foundation-analytics-engine.md
points: 5
dependencies:
  - docs/roadmap/stories/sentiment-insight-foundation-analytics-engine-03-aggregation-jobs.md
---
# Story: Expose analytics via TRPC router

## Background
Create typed TRPC procedures for retrieving metrics, trends, and anomalies with proper pagination and filtering.

## Acceptance Criteria
- Procedures documented for heatmaps, trending axioms, anomaly feed, and participation summary
- Input validation guards against malformed filters and ensures access control
- Performance benchmarks meet <500ms response time for standard queries
