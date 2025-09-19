---
epic: docs/roadmap/epics/federation-readiness-program-sync-fabric.md
points: 8
dependencies:
  - docs/roadmap/stories/federation-readiness-program-sync-fabric-01-transport-design.md
---
# Story: Implement inbound federation listener

## Background
Create listener that verifies signatures, deduplicates events, and applies updates idempotently.

## Acceptance Criteria
- Signature verification uses partner public keys
- Duplicate detection ensures once-only application
- Dead-letter queue handles malformed events
