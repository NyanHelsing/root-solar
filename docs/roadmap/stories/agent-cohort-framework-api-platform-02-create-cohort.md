---
epic: docs/roadmap/epics/agent-cohort-framework-api-platform.md
points: 5
dependencies:
  - docs/roadmap/stories/agent-cohort-framework-api-platform-01-contract-design.md
---
# Story: Implement create cohort endpoint

## Background
Allow stewards to create cohorts with mission data, guardrails, and telemetry config.

## Acceptance Criteria
- Endpoint validates axiom IDs and guardrails
- Error handling covered for invalid credentials
- Integration tests confirm persistence
