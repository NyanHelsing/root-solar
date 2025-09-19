---
epic: docs/roadmap/epics/sentiment-insight-foundation-analytics-engine.md
points: 8
dependencies:
  - docs/roadmap/stories/sentiment-insight-foundation-analytics-engine-02-data-modeling.md
---
# Story: Implement aggregation jobs

## Background
Build scheduled or streaming jobs that compute rolling metrics and persist them to the analytics model.

## Acceptance Criteria
- Aggregation code covers 1h/24h/7d deltas and participation counts
- Jobs handle late-arriving events without duplicating data
- Unit and integration tests validate metric accuracy
