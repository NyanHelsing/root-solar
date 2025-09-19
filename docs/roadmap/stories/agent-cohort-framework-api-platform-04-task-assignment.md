---
epic: docs/roadmap/epics/agent-cohort-framework-api-platform.md
points: 5
dependencies:
  - docs/roadmap/stories/agent-cohort-framework-api-platform-03-membership-management.md
  - docs/roadmap/stories/agent-cohort-framework-guardrail-engine-01-policy-language.md
---
# Story: Expose task assignment endpoints

## Background
Provide API for stewards to queue tasks and for agents to accept/decline within guardrail constraints.

## Acceptance Criteria
- Task lifecycle states documented and enforced
- Guardrail evaluation invoked before assignment
- Telemetry emitted for task events
