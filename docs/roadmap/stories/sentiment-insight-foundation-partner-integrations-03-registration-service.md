---
epic: docs/roadmap/epics/sentiment-insight-foundation-partner-integrations.md
points: 5
dependencies:
  - docs/roadmap/stories/sentiment-insight-foundation-partner-integrations-02-webhook-contract.md
---
# Story: Implement webhook registration endpoints

## Background
Build endpoints for partners to register, rotate secrets, and manage webhook subscriptions.

## Acceptance Criteria
- Create, update, delete flows implemented with authentication
- Secrets stored encrypted and rotated via admin workflow
- Integration tests cover subscription lifecycle
