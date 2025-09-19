---
epic: docs/roadmap/epics/sentiment-insight-foundation-ingest-pipeline.md
points: 5
dependencies:
  - docs/roadmap/stories/sentiment-insight-foundation-ingest-pipeline-05-idempotency-guards.md
  - docs/roadmap/stories/sentiment-insight-foundation-ingest-pipeline-06-observability.md
---

# Story: Run backpressure and failure mode tests

## Background
Stress the pipeline with burst loads and downstream outages to validate backpressure behaviour and recovery.

## Acceptance Criteria
- Burst test achieves 5x expected throughput without data loss
- Downstream outage triggers queue retention and automatic recovery once restored
- Test report shared with mitigation notes for any bottlenecks
