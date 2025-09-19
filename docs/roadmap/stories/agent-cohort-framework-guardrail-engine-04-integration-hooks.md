---
epic: docs/roadmap/epics/agent-cohort-framework-guardrail-engine.md
points: 5
dependencies:
  - docs/roadmap/stories/agent-cohort-framework-guardrail-engine-02-parser-runtime.md
  - docs/roadmap/stories/agent-cohort-framework-api-platform-02-create-cohort.md
---
# Story: Integrate guardrail engine with cohort APIs

## Background
Wire guardrail evaluations into cohort creation, task assignment, and action reporting flows.

## Acceptance Criteria
- Cohort creation validates guardrails before persistence
- Task assignments blocked when guardrails deny
- Decision logs stored with context
