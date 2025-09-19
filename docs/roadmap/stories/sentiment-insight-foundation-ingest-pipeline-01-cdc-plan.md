---
epic: docs/roadmap/epics/sentiment-insight-foundation-ingest-pipeline.md
points: 3
dependencies:
  -
---

# Story: Document CDC requirements and data contracts

## Background
We need clarity on which sentiment mutations must be captured, how to map SurrealDB responses to normalized events, and what latency targets we are committing to before building the pipeline.

## Acceptance Criteria
- Stakeholders sign off on CDC scope including create/update/delete events and required fields
- Latency and ordering requirements documented with acceptable tolerances
- Event payload contract published for downstream consumers
