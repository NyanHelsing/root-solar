---
epic: docs/roadmap/epics/sentiment-insight-foundation-partner-integrations.md
points: 5
dependencies:
  - docs/roadmap/stories/sentiment-insight-foundation-partner-integrations-03-registration-service.md
  - docs/roadmap/stories/sentiment-insight-foundation-analytics-engine-05-trpc-surface.md
---
# Story: Create webhook delivery worker

## Background
Send sentiment events to subscribed partners with retries, backoff, and dead-letter handling.

## Acceptance Criteria
- Deliveries signed with partner-specific secrets
- Retry policy configurable per subscription
- Dead-letter queue with manual replay documented
