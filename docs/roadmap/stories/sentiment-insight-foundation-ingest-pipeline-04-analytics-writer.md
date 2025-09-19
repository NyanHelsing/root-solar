---
epic: docs/roadmap/epics/sentiment-insight-foundation-ingest-pipeline.md
points: 8
dependencies:
  - docs/roadmap/stories/sentiment-insight-foundation-ingest-pipeline-03-queue-bootstrap.md
---

# Story: Implement analytics store writer

## Background
Consume queued events and persist them into the columnar analytics store with partitioning for efficient reads.

## Acceptance Criteria
- Events written to analytics store with partitioning by day and sentiment type
- Idempotent writes verified through replay tests
- Writer exposes metrics for batch size, flush latency, and failures
