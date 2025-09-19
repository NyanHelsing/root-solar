---
epic: docs/roadmap/epics/agent-cohort-framework-schema-layer.md
points: 5
dependencies:
  - docs/roadmap/stories/agent-cohort-framework-schema-layer-02-erd-design.md
---
# Story: Implement cohort migrations

## Background
Create migrations for cohort, membership, run, and guardrail tables with indices and constraints.

## Acceptance Criteria
- Migrations applied in staging without errors
- Rollback tested and documented
- CI job added to verify migrations
