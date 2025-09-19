---
epic: docs/roadmap/epics/axiom-origination-pilot-provenance-graph.md
points: 5
dependencies:
  - docs/roadmap/stories/axiom-origination-pilot-provenance-graph-02-migrations.md
---
# Story: Store and secure session transcripts

## Background
Implement storage for optional session transcripts with encryption and access controls.

## Acceptance Criteria
- Transcripts stored encrypted at rest with key rotation policy
- Access control enforced by role with audit logging
- Deletion and redaction workflows implemented
