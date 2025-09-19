---
epic: docs/roadmap/epics/axiom-origination-pilot-provenance-graph.md
points: 5
dependencies:
  - docs/roadmap/stories/axiom-origination-pilot-provenance-graph-02-migrations.md
  - docs/roadmap/stories/axiom-origination-pilot-collaboration-canvas-06-audit-log.md
---
# Story: Map canvas events to provenance records

## Background
Translate collaborative events into normalized provenance entries with references to axioms and participants.

## Acceptance Criteria
- Event mapper handles create/update/comment/dissent events
- Invalid events logged and quarantined without breaking flow
- Integration tests confirm correct linkage to axiom IDs
