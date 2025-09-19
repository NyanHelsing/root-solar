---
epic: docs/roadmap/epics/sentiment-insight-foundation-experience-surface.md
points: 5
dependencies:
  - docs/roadmap/stories/sentiment-insight-foundation-experience-surface-03-component-build.md
  - docs/roadmap/stories/sentiment-insight-foundation-analytics-engine-05-trpc-surface.md
---
# Story: Integrate analytics APIs into dashboard views

## Background
Connect UI components to live analytics endpoints with loading states, error handling, and caching.

## Acceptance Criteria
- Heatmap, trend, and anomaly widgets display live data with skeleton fallbacks
- Client-side caching avoids redundant API calls within a session
- Error states surfaced with actionable messaging
