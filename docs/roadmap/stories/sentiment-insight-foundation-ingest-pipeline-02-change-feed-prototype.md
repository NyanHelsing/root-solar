---
epic: docs/roadmap/epics/sentiment-insight-foundation-ingest-pipeline.md
points: 5
dependencies:
  - docs/roadmap/stories/sentiment-insight-foundation-ingest-pipeline-01-cdc-plan.md
---

# Story: Prototype SurrealDB change feed extractor

## Background
With requirements settled, build the first extractor that listens for sentiment table changes and emits normalized events to a local queue.

## Acceptance Criteria
- Extractor captures create/update/delete events with primary key and timestamp metadata
- Malformed events produce retryable errors without crashing the worker
- Unit tests cover happy path and failure fallback
