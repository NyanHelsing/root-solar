---
epic: docs/roadmap/epics/federation-readiness-program-sync-fabric.md
points: 8
dependencies:
  - docs/roadmap/stories/federation-readiness-program-sync-fabric-01-transport-design.md
---
# Story: Implement outbound federation service

## Background
Build edge service that publishes signed events to partners with replay protection.

## Acceptance Criteria
- Service batches and signs events per partner
- Replay cache prevents duplicate deliveries
- Integration tests validate success and failure paths
