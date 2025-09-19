---
epic: docs/roadmap/epics/sentiment-insight-foundation-ingest-pipeline.md
points: 3
dependencies:
  - docs/roadmap/stories/sentiment-insight-foundation-ingest-pipeline-04-analytics-writer.md
---

# Story: Instrument pipeline observability

## Background
Add metrics, logs, and traces that make pipeline lag and failures visible to the ops team.

## Acceptance Criteria
- Dashboards show end-to-end lag, queue depth, and error rates
- Alerts configured for lag > target thresholds and fatal extractor errors
- Runbook updated with observability panel links
