---
epic: docs/roadmap/epics/agent-cohort-framework-api-platform.md
points: 3
dependencies:
  - docs/roadmap/stories/agent-cohort-framework-api-platform-03-membership-management.md
---
# Story: Implement fine-grained authorization

## Background
Introduce RBAC/ABAC ensuring stewards, agents, and observers have appropriate scoped access.

## Acceptance Criteria
- Authorization middleware applied to all cohort routes
- Unit tests cover positive/negative role scenarios
- Policy documentation updated
