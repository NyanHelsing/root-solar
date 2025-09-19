---
epic: docs/roadmap/epics/sentiment-insight-foundation-analytics-engine.md
points: 3
dependencies:
  - docs/roadmap/stories/sentiment-insight-foundation-analytics-engine-05-trpc-surface.md
  - docs/roadmap/stories/sentiment-insight-foundation-analytics-engine-04-anomaly-detection.md
---
# Story: Implement caching and smoothing

## Background
Reduce noise and load by caching frequent queries and applying smoothing to sparse metrics.

## Acceptance Criteria
- Caching layer configured with TTLs aligned to metric freshness
- Smoothing logic documented and applied to low-volume sentiment types
- Load test confirms cache hit rate >70% for dashboard queries
