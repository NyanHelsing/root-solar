---
epic: docs/roadmap/epics/sentiment-insight-foundation-ingest-pipeline.md
points: 5
dependencies:
  - docs/roadmap/stories/sentiment-insight-foundation-ingest-pipeline-04-analytics-writer.md
---

# Story: Harden idempotency and replay handling

## Background
Ensure replays or duplicated events do not corrupt analytics data; design sequence tracking and dead-letter handling.

## Acceptance Criteria
- Sequence tracking implemented with deterministic dedupe keys
- Dead-letter queue configured and documented for manual replay
- Regression tests cover replay of at least 1,000 historical events without divergence
