---
epic: docs/roadmap/epics/agent-cohort-framework-schema-layer.md
points: 2
dependencies:
  - docs/roadmap/stories/agent-cohort-framework-schema-layer-03-migrations.md
---
# Story: Add schema quality gates

## Background
Introduce CI checks to prevent schema drift and ensure guardrails remain enforced.

## Acceptance Criteria
- Automated tests validate foreign key consistency
- Schema drift alerts configured
- Documentation instructs new migrations to run checks
