---
epic: docs/roadmap/epics/axiom-origination-pilot-provenance-graph.md
points: 5
dependencies:
  - docs/roadmap/stories/axiom-origination-pilot-provenance-graph-01-schema-spec.md
---
# Story: Implement provenance migrations

## Background
Create SurrealDB migrations to add provenance tables, indexes, and constraints.

## Acceptance Criteria
- Migrations run in staging with no data loss
- Rollback path tested
- Automated migration tests added to CI
